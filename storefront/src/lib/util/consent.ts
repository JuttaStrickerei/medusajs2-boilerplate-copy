import { META_PIXEL_ID } from "./meta-pixel-id"

// Bumped when the banner asks for something new (the Meta Pixel's
// "marketing" category): vanilla-cookieconsent then shows the banner again
// and a saved choice from before does not count any more
export const CONSENT_REVISION = META_PIXEL_ID ? 1 : 0

// vanilla-cookieconsent v3 keeps its state as URI-encoded JSON in the
// "cc_cookie" cookie ({ categories: ["necessary", "analytics"], revision, ... }).
// Takes the raw value (browser) or the decoded one (Next's cookies() on the
// server), so both check consent the same way.
export function consentCategoriesFrom(value: string | undefined): string[] {
  if (!value) return []
  try {
    const json = value.trimStart().startsWith("{")
      ? value
      : decodeURIComponent(value)
    const state = JSON.parse(json)
    if ((state?.revision ?? 0) !== CONSENT_REVISION) return []
    return Array.isArray(state?.categories) ? state.categories : []
  } catch {
    return []
  }
}

export function hasConsentFor(category: string): boolean {
  if (typeof document === "undefined") return false
  const match = document.cookie.match(/(?:^|;)\s*cc_cookie=([^;]+)/)
  return consentCategoriesFrom(match?.[1]).includes(category)
}
