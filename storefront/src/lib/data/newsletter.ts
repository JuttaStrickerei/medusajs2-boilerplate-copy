"use server"

import { sdk } from "@lib/config"
import { consentCategoriesFrom } from "@lib/util/consent"
import { HERKUNFT_COOKIE, parseHerkunft } from "@lib/util/herkunft"
import { MARKETING_CATEGORY } from "@lib/util/meta-pixel"
import { cookies as nextCookies } from "next/headers"

// Herkunft für den persönlichen Willkommens-Code (Backend: api/store/newsletter).
// Nur mit „Marketing“-Zustimmung: Kennungen der Ankunftsadresse und die Meta-Kennungen.
// Fehlt _fbc, obwohl die Ankunft ein fbclid hatte (Zustimmung erst nach dem
// Weiterklicken), entsteht die Kennung so, wie Meta sie beschreibt: fb.1.<Zeit>.<fbclid>
async function readHerkunft(): Promise<Record<string, unknown> | undefined> {
  try {
    const cookies = await nextCookies()
    const consented = consentCategoriesFrom(
      cookies.get("cc_cookie")?.value
    ).includes(MARKETING_CATEGORY)
    if (!consented) return undefined

    const landing = parseHerkunft(cookies.get(HERKUNFT_COOKIE)?.value)
    const { fbclid, ...source } = landing ?? {}
    const fbc =
      cookies.get("_fbc")?.value ||
      (fbclid && landing?.landing_at
        ? `fb.1.${landing.landing_at}.${fbclid}`
        : undefined)
    const fbp = cookies.get("_fbp")?.value

    const herkunft = { ...source, fbc, fbp }
    const filled = Object.fromEntries(
      Object.entries(herkunft).filter(([, value]) => value !== undefined)
    )
    return Object.keys(filled).length ? filled : undefined
  } catch {
    return undefined
  }
}

export const subscribeToNewsletter = async (email: string) => {
  const herkunft = await readHerkunft()

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
    },
  })

  return result
}
