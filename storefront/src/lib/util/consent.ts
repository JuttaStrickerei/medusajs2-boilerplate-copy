import { META_PIXEL_ID } from "./meta-pixel-id"

// Bumped when the banner asks for something new (the Meta Pixel's
// "marketing" category): vanilla-cookieconsent then shows the banner again
// and a saved choice from before does not count any more
export const CONSENT_REVISION = META_PIXEL_ID ? 1 : 0

// vanilla-cookieconsent v3 keeps its state as URI-encoded JSON in the
// "cc_cookie" cookie ({ categories: ["necessary", "analytics"], revision, ... })
export function hasConsentFor(category: string): boolean {
  try {
    const match = document.cookie.match(/(?:^|;)\s*cc_cookie=([^;]+)/)
    if (!match) return false
    const state = JSON.parse(decodeURIComponent(match[1]))
    return (
      (state?.revision ?? 0) === CONSENT_REVISION &&
      Array.isArray(state?.categories) &&
      state.categories.includes(category)
    )
  } catch {
    return false
  }
}
