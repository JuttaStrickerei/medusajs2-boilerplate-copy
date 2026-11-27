import { hasConsentFor } from "./consent"
import { MARKETING_CATEGORY } from "./meta-pixel"

/**
 * Herkunft eines Besuchs (Anzeige, Kampagne), damit sie an einem Newsletter-Code
 * hängen bleibt, auch wenn die Person die Willkommens-Mail in einem anderen Browser
 * öffnet und dort kauft (data/newsletter → Backend legt sie am Code ab).
 *
 * Gelesen wird nur die Ankunftsadresse (utm_*, fbclid), die Seite und die Uhrzeit.
 * Bis zur Zustimmung zu „Marketing“ bleibt das im Arbeitsspeicher des Tabs, danach
 * steht es im Cookie jutta_herkunft (30 Tage). Der Banner löscht es beim Widerruf.
 */

export const HERKUNFT_COOKIE = "jutta_herkunft"
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60
// Kampagnen-Kennungen werden gekürzt, Klickkennungen nie: gekürzt wären sie falsch
const MAX_TEXT = 120
const MAX_CLICK_ID = 500
const CLICK_IDS = new Set(["fbclid", "gclid"])
// Browser nehmen Cookies bis rund 4 KB an, ein zu großes fiele still weg
const MAX_COOKIE_VALUE = 3500

export type Herkunft = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  fbclid?: string
  gclid?: string
  landing_path?: string
  landing_at?: number
}

const PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
] as const

const clean = (key: string, value: string | null): string | undefined => {
  const text = value?.trim()
  if (!text) return undefined
  if (!CLICK_IDS.has(key)) return text.slice(0, MAX_TEXT)
  return text.length <= MAX_CLICK_ID && /^[\w-]+$/.test(text) ? text : undefined
}

// Ankunft in diesem Tab: gelesen einmal je vollem Seitenaufruf (Anzeigen-Links laden die
// Seite neu, Links innerhalb des Shops tragen keine Kennungen)
let landing: Herkunft | null = null

/** Liest die Ankunftsadresse. Nur Besuche mit Kampagnen- oder Klickkennung zählen. */
export function captureLanding(): void {
  if (typeof window === "undefined" || landing) return
  const params = new URLSearchParams(window.location.search)
  // Links aus unseren eigenen Mails sind keine Herkunft (die steht schon am Code)
  if (
    params.get("utm_source")?.toLowerCase() === "newsletter" ||
    params.get("utm_medium")?.toLowerCase() === "email"
  ) {
    return
  }
  const found: Herkunft = {}
  for (const key of PARAMS) {
    const value = clean(key, params.get(key))
    if (value) found[key] = value
  }
  if (!Object.keys(found).length) return
  landing = {
    ...found,
    landing_path: window.location.pathname.slice(0, MAX_TEXT),
    landing_at: Date.now(),
  }
  persistHerkunft()
}

/** Schreibt die Ankunft ins Cookie, sobald „Marketing“ erlaubt ist. Die neueste Ankunft gewinnt. */
export function persistHerkunft(): void {
  if (typeof document === "undefined" || !landing) return
  if (!hasConsentFor(MARKETING_CATEGORY)) return
  const value = encodeURIComponent(JSON.stringify(landing))
  if (value.length > MAX_COOKIE_VALUE) return
  document.cookie = `${HERKUNFT_COOKIE}=${value}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${
    window.location.protocol === "https:" ? "; Secure" : ""
  }`
}

/** Liest das Cookie (Server: Wert aus cookies(), schon entschlüsselt oder nicht). */
export function parseHerkunft(value: string | undefined): Herkunft | null {
  if (!value) return null
  try {
    const json = value.trimStart().startsWith("{")
      ? value
      : decodeURIComponent(value)
    const raw = JSON.parse(json)
    if (!raw || typeof raw !== "object") return null
    const result: Herkunft = {}
    for (const key of [...PARAMS, "landing_path"] as const) {
      if (typeof raw[key] === "string") {
        const text = clean(key, raw[key])
        if (text) result[key] = text
      }
    }
    if (typeof raw.landing_at === "number" && Number.isFinite(raw.landing_at)) {
      result.landing_at = Math.round(raw.landing_at)
    }
    return Object.keys(result).length ? result : null
  } catch {
    return null
  }
}
