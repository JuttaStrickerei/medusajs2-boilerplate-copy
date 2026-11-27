"use server"

import { sdk } from "@lib/config"
import { consentCategoriesFrom } from "@lib/util/consent"
import { getBaseURL } from "@lib/util/env"
import { HERKUNFT_COOKIE, parseHerkunft } from "@lib/util/herkunft"
import { MARKETING_CATEGORY } from "@lib/util/meta-pixel"
import { cookies as nextCookies, headers as nextHeaders } from "next/headers"

type Signals = {
  herkunft?: Record<string, unknown>
  meta_lead?: Record<string, unknown>
}

const withoutEmpty = (value: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== "")
  )

// Seite der Anmeldung ohne Abfrage (nichts aus der Adresszeile an Meta)
function pageUrl(referer: string | null): string {
  try {
    const url = new URL(referer ?? "")
    return `${url.origin}${url.pathname}`
  } catch {
    return `${getBaseURL()}/at`
  }
}

// Nur mit „Marketing“-Zustimmung, sonst nichts davon:
// - herkunft: für den persönlichen Willkommens-Code (Backend: api/store/newsletter).
//   Kennungen der Ankunftsadresse und die Meta-Klickkennung. Fehlt _fbc, obwohl die
//   Ankunft ein fbclid hatte (Zustimmung erst nach dem Weiterklicken), entsteht die
//   Kennung so, wie Meta sie beschreibt: fb.1.<Zeit>.<fbclid>
// - meta_lead: Browser-Angaben für das Meta-Ereignis „Lead“, das nur der Server
//   meldet (mit der gehashten E-Mail-Adresse). Wird nicht gespeichert.
async function readSignals(): Promise<Signals> {
  try {
    const cookies = await nextCookies()
    const consented = consentCategoriesFrom(
      cookies.get("cc_cookie")?.value
    ).includes(MARKETING_CATEGORY)
    if (!consented) return {}

    const landing = parseHerkunft(cookies.get(HERKUNFT_COOKIE)?.value)
    const { fbclid, ...source } = landing ?? {}
    const fbc =
      cookies.get("_fbc")?.value ||
      (fbclid && landing?.landing_at
        ? `fb.1.${landing.landing_at}.${fbclid}`
        : undefined)

    const herkunft = withoutEmpty({ ...source, fbc })

    const headers = await nextHeaders()
    const meta_lead = withoutEmpty({
      event_source_url: pageUrl(headers.get("referer")),
      fbc,
      fbp: cookies.get("_fbp")?.value,
      client_ip_address:
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip") ||
        undefined,
      client_user_agent: headers.get("user-agent") ?? undefined,
    })

    return {
      ...(Object.keys(herkunft).length ? { herkunft } : {}),
      meta_lead,
    }
  } catch {
    return {}
  }
}

export const subscribeToNewsletter = async (email: string) => {
  const { herkunft, meta_lead } = await readSignals()

  const result = await sdk.client.fetch<{
    success: boolean
    message?: string
    alreadySubscribed?: boolean
    notSubscribed?: boolean
    signupUrl?: string
  }>(`/store/newsletter`, {
    method: "POST",
    body: {
      email,
      ...(herkunft ? { herkunft } : {}),
      ...(meta_lead ? { meta_lead } : {}),
    },
  })

  return result
}
