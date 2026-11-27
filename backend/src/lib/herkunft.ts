import { z } from "zod"

/**
 * Herkunft zum persönlichen Newsletter-Code (storefront: lib/util/herkunft,
 * lib/data/newsletter). Wer über eine Anzeige kommt, sich anmeldet und die
 * Willkommens-Mail in einem anderen Browser öffnet, bleibt so mit der Anzeige
 * verbunden: Der Code kommt beim Kauf zurück.
 *
 * Die Storefront schickt das nur mit „Marketing“-Zustimmung. Gespeichert wird
 * es im Modul herkunft (eigene Tabelle, über keine Shop-Schnittstelle lesbar):
 * Kennungen der Ankunftsadresse und die Meta-Klickkennung (_fbc). Beim Kauf
 * mit dem Code kommt eine Zusammenfassung ohne Meta-Kennungen an die Bestellung
 * (metadata.herkunft), der Eintrag wird gelöscht (Subscriber meta-capi-purchase,
 * Job herkunft-aufraeumen für Codes, die nie eingelöst werden).
 */

// Schlüssel an der Bestellung
export const HERKUNFT_KEY = "herkunft"
// Meta ordnet Käufe bis 7 Tage nach dem Klick zu, ältere Klickkennungen helfen nicht
const FBC_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

// Ein ungültiges Feld fällt einzeln weg, die übrigen bleiben
const optionalText = (max: number, pattern?: RegExp) => {
  const base = z.string().trim().min(1).max(max)
  return (pattern ? base.regex(pattern) : base).optional().catch(undefined)
}

// _fbc: fb.<Unterdomain-Index>.<Zeit in ms>.<fbclid>[.<Anhang>]
const FBC_PATTERN = /^fb\.\d\.\d{10,16}\.[\w-]+(\.[\w-]+)?$/

export const herkunftSchema = z.object({
  utm_source: optionalText(200),
  utm_medium: optionalText(200),
  utm_campaign: optionalText(200),
  utm_content: optionalText(200),
  utm_term: optionalText(200),
  gclid: optionalText(500, /^[\w-]+$/),
  landing_path: optionalText(200, /^\//),
  landing_at: z.number().int().positive().optional().catch(undefined),
  fbc: optionalText(600, FBC_PATTERN),
})

export type Herkunft = z.infer<typeof herkunftSchema>

export type StoredHerkunft = Herkunft & { angemeldet_at: string }

/** Nur die gesetzten Felder (zum Speichern) */
export function filledHerkunft(herkunft: Herkunft | undefined): Herkunft | null {
  if (!herkunft) return null
  const filled = Object.fromEntries(
    Object.entries(herkunft).filter(([, value]) => value !== undefined)
  ) as Herkunft
  return Object.keys(filled).length ? filled : null
}

/** Gespeicherte Herkunft (Modul herkunft, Feld data), wenn sie lesbar ist */
export function readStoredHerkunft(data: unknown): StoredHerkunft | null {
  if (!data || typeof data !== "object") return null
  const { angemeldet_at, ...rest } = data as Record<string, unknown>
  const parsed = filledHerkunft(herkunftSchema.parse(rest))
  if (!parsed || typeof angemeldet_at !== "string") return null
  return { ...parsed, angemeldet_at }
}

/** Klickzeit aus _fbc (ms), falls lesbar */
function fbcClickTime(fbc: string | undefined): number | null {
  if (!fbc) return null
  const ms = Number(fbc.split(".")[2])
  return Number.isFinite(ms) && ms > 0 ? ms : null
}

/**
 * Welche Klickkennung die Meldung an Meta bekommt: die aus dem Kauf-Browser oder
 * die aus der Anmeldung. Der neuere Klick gewinnt. Der aus der Anmeldung zählt
 * nur, wenn er höchstens 7 Tage vor dem Kauf war. Ist die Zeit im Kauf-Browser
 * nicht lesbar, bleibt dessen Kennung (wie ohne diese Funktion).
 */
export function pickFbc(
  ownFbc: string | undefined,
  herkunft: StoredHerkunft,
  orderedAt: Date
): string | undefined {
  const signupClick = fbcClickTime(herkunft.fbc)
  const signupAge =
    signupClick === null ? null : orderedAt.getTime() - signupClick
  const signupUsable =
    signupAge !== null && signupAge >= 0 && signupAge <= FBC_MAX_AGE_MS
  if (!signupUsable) return ownFbc
  if (!ownFbc) return herkunft.fbc

  const ownClick = fbcClickTime(ownFbc)
  if (ownClick === null) return ownFbc
  return signupClick! > ownClick ? herkunft.fbc : ownFbc
}

/**
 * Fehlermeldung fürs Protokoll ohne die Daten: Datenbankfehler enthalten die ganze
 * Abfrage samt Werten (Code, Klickkennung), davon bleibt nur der Grund am Ende.
 */
export function shortError(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown error"
  return (message.split(" - ").pop() ?? message).slice(0, 160)
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
