// Meta Pixel ID from the Events Manager (digits only). Unset or invalid = the
// pixel is off and the cookie banner does not ask for marketing consent.
// NEXT_PUBLIC_*: baked in at build time, so a change needs a new deploy.
const PIXEL_ID_PATTERN = /^\d{6,20}$/
const configuredPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? ""

export const META_PIXEL_ID = PIXEL_ID_PATTERN.test(configuredPixelId)
  ? configuredPixelId
  : null
