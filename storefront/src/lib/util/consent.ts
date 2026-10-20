// Bumped when the banner asks for something new (1: the Meta Pixel's
// "marketing" category, 2: Google's ad signals in the same category, GA4 is
// linked with Google Ads): vanilla-cookieconsent then shows the banner again
// and a saved choice from before does not count any more
export const CONSENT_REVISION = 2

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
