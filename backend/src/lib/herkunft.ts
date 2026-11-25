import type { UpdatePromotionDTO } from "@medusajs/framework/types"
import { z } from "zod"

/**
 * Herkunft am persönlichen Newsletter-Code (storefront: lib/util/herkunft,
 * lib/data/newsletter). Wer über eine Anzeige kommt, sich anmeldet und die
 * Willkommens-Mail in einem anderen Browser öffnet, bleibt so mit der Anzeige
 * verbunden: Der Code kommt beim Kauf zurück.
 *
 * Die Storefront schickt das nur mit „Marketing“-Zustimmung. Am Code stehen die
 * Kennungen der Ankunftsadresse und die Meta-Kennungen (_fbc, _fbp). Beim Kauf
 * mit dem Code kommt eine Zusammenfassung ohne Meta-Kennungen an die Bestellung,
 * am Code wird alles gelöscht (Subscriber meta-capi-purchase, Job
 * herkunft-aufraeumen für Codes, die nie eingelöst werden).
 */

export const HERKUNFT_KEY = "herkunft"
// Meta ordnet Käufe bis 7 Tage nach dem Klick zu, ältere Klickkennungen helfen nicht
const FBC_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const text = (max: number) => z.string().trim().min(1).max(max)

export const herkunftSchema = z
  .object({
    utm_source: text(120).optional(),
    utm_medium: text(120).optional(),
    utm_campaign: text(120).optional(),
    utm_content: text(120).optional(),
    utm_term: text(120).optional(),
    gclid: text(120).optional(),
    landing_path: text(120).regex(/^\//).optional(),
    landing_at: z.number().int().positive().optional(),
    // fb.<Unterdomain-Index>.<Zeit in ms>.<fbclid bzw. Zufallszahl>
    fbc: text(500).regex(/^fb\.\d\.\d{10,16}\.[\w-]+$/).optional(),
    fbp: text(120).regex(/^fb\.\d\.\d{10,16}\.\d+$/).optional(),
  })
  .strict()

export type Herkunft = z.infer<typeof herkunftSchema>

export type StoredHerkunft = Herkunft & { angemeldet_at: string }

/** Herkunft aus den Metadaten eines Rabatts, wenn sie gültig ist */
export function readStoredHerkunft(metadata: unknown): StoredHerkunft | null {
  const value = (metadata as Record<string, unknown> | null)?.[HERKUNFT_KEY]
  if (!value || typeof value !== "object") return null
  const { angemeldet_at, ...rest } = value as Record<string, unknown>
  const parsed = herkunftSchema.safeParse(rest)
  if (!parsed.success || typeof angemeldet_at !== "string") return null
  return { ...parsed.data, angemeldet_at }
}

/** Klickzeit aus _fbc, falls lesbar */
function fbcClickTime(fbc: string): number | null {
  const ms = Number(fbc.split(".")[2])
  return Number.isFinite(ms) ? ms : null
}

/** Klickkennung aus der Anmeldung, wenn der Klick höchstens 7 Tage vor dem Kauf war */
export function usableFbc(
  herkunft: StoredHerkunft,
  orderedAt: Date
): string | undefined {
  if (!herkunft.fbc) return undefined
  const clickedAt = fbcClickTime(herkunft.fbc)
  if (clickedAt === null) return undefined
  const age = orderedAt.getTime() - clickedAt
  return age >= 0 && age <= FBC_MAX_AGE_MS ? herkunft.fbc : undefined
}

/** Was an der Bestellung stehen bleibt: woher sie kam, ohne Meta-Kennungen */
export function orderHerkunft(
  herkunft: StoredHerkunft,
  code: string
): Record<string, string | boolean> {
  const summary: Record<string, string | boolean | undefined> = {
    ueber: `Newsletter-Code ${code}`,
    quelle: herkunft.utm_source,
    medium: herkunft.utm_medium,
    kampagne: herkunft.utm_campaign,
    anzeige: herkunft.utm_content,
    begriff: herkunft.utm_term,
    ankunft_seite: herkunft.landing_path,
    ankunft_at: herkunft.landing_at
      ? new Date(herkunft.landing_at).toISOString()
      : undefined,
    anmeldung_at: herkunft.angemeldet_at,
    meta_klick: !!herkunft.fbc,
    google_klick: !!herkunft.gclid,
  }
  return Object.fromEntries(
    Object.entries(summary).filter(([, value]) => value !== undefined)
  ) as Record<string, string | boolean>
}

/**
 * Änderung, die die Herkunft am Rabatt löscht. Metadaten werden zusammengeführt,
 * ein leerer Text löscht den Schlüssel (geprüft mit Medusa 2.12.3). Die Typen von
 * Medusa kennen metadata beim Rabatt nicht, das Modell schon.
 */
export function clearHerkunftUpdate(promotionId: string): UpdatePromotionDTO {
  return { id: promotionId, metadata: { [HERKUNFT_KEY]: "" } } as UpdatePromotionDTO
}
