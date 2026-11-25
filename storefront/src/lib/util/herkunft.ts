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
const MAX_LENGTH = 120

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

const clean = (value: string | null): string | undefined => {
  const text = value?.trim()
  return text ? text.slice(0, MAX_LENGTH) : undefined
}

// Ankunft in diesem Tab (einmal je vollem Seitenaufruf)
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
    const value = clean(params.get(key))
    if (value) found[key] = value
  }
  if (!Object.keys(found).length) return
  landing = {
    ...found,
    landing_path: window.location.pathname.slice(0, MAX_LENGTH),
    landing_at: Date.now(),
  }
  persistHerkunft()
}

/** Schreibt die Ankunft ins Cookie, sobald „Marketing“ erlaubt ist. Die neueste Ankunft gewinnt. */
export function persistHerkunft(): void {
  if (typeof document === "undefined" || !landing) return
  if (!hasConsentFor(MARKETING_CATEGORY)) return
  document.cookie = `${HERKUNFT_COOKIE}=${encodeURIComponent(
    JSON.stringify(landing)
  )}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${
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
        const text = clean(raw[key])
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
