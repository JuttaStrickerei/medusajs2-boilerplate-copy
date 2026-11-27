import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HERKUNFT_MODULE } from "../modules/herkunft"
import type HerkunftModuleService from "../modules/herkunft/service"
import { WELCOME_CODE_VALID_DAYS } from "../workflows/create-welcome-promotion"

const DAY_MS = 24 * 60 * 60 * 1000
// Einen Tag länger als der Code gilt: Ein Kauf am letzten Tag findet den Eintrag noch
const KEEP_DAYS = WELCOME_CODE_VALID_DAYS + 1
const PAGE_SIZE = 200

/**
 * Löscht die Herkunft (Modul herkunft) zu Willkommens-Codes, die nie eingelöst
 * wurden, sobald der Code abgelaufen ist. Eingelöste Codes räumt der Subscriber
 * meta-capi-purchase gleich beim Kauf auf. So steht es in der Datenschutzerklärung
 * (spätestens 32 Tage nach der Anmeldung, der Job läuft einmal pro Nacht).
 */
export default async function herkunftAufraeumen(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const herkunftModule: HerkunftModuleService = container.resolve(HERKUNFT_MODULE)
  const cutoff = new Date(Date.now() - KEEP_DAYS * DAY_MS)
  let removed = 0

  try {
    for (;;) {
      const expired = await herkunftModule.listNewsletterHerkunfts(
        { created_at: { $lt: cutoff } },
        { select: ["id"], take: PAGE_SIZE }
      )
      if (!expired.length) break
      await herkunftModule.deleteNewsletterHerkunfts(expired.map((entry) => entry.id))
      removed += expired.length
      if (expired.length < PAGE_SIZE) break
    }
    if (removed) logger.info(`[Herkunft] Removed ${removed} entries of expired welcome codes`)
  } catch (error) {
    logger.error(`[Herkunft] Clean-up failed: ${(error as Error).message}`)
  }
}

export const config = {
  name: "herkunft-aufraeumen",
  // jede Nacht um 3:30 (Serverzeit UTC)
  schedule: "30 3 * * *",
}
