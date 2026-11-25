import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { clearHerkunftUpdate, HERKUNFT_KEY } from "../lib/herkunft"
import { WELCOME_CODE_PREFIX } from "../workflows/create-welcome-promotion"

const PAGE_SIZE = 200

/**
 * Löscht die Herkunft (lib/herkunft) an Willkommens-Codes, die abgelaufen sind,
 * ohne eingelöst zu werden. Eingelöste Codes räumt der Subscriber
 * meta-capi-purchase gleich beim Kauf auf. So steht es in der Datenschutzerklärung.
 */
export default async function herkunftAufraeumen(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const promotionModule = container.resolve(Modules.PROMOTION)
  const now = Date.now()
  let cleaned = 0

  try {
    for (let skip = 0; ; skip += PAGE_SIZE) {
      const promotions = await promotionModule.listPromotions(
        { code: { $like: `${WELCOME_CODE_PREFIX}%` } } as any,
        { select: ["id", "code", "metadata"], relations: ["campaign"], skip, take: PAGE_SIZE }
      )
      const expired = promotions.filter((promotion: any) => {
        const endsAt = promotion.campaign?.ends_at
        return (
          promotion.metadata?.[HERKUNFT_KEY] &&
          endsAt &&
          new Date(endsAt).getTime() < now
        )
      })
      if (expired.length) {
        await promotionModule.updatePromotions(
          expired.map((promotion: any) => clearHerkunftUpdate(promotion.id))
        )
        cleaned += expired.length
      }
      if (promotions.length < PAGE_SIZE) break
    }
    if (cleaned) logger.info(`[Herkunft] Removed from ${cleaned} expired welcome codes`)
  } catch (error) {
    logger.error(`[Herkunft] Clean-up failed: ${(error as Error).message}`)
  }
}

export const config = {
  name: "herkunft-aufraeumen",
  // jede Nacht um 3:30 (Serverzeit UTC)
  schedule: "30 3 * * *",
}
