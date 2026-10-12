// Meta Pixel ID from the Events Manager. Public anyway (it is in every page),
// so it lives here like the GA ID in app/layout.tsx.
// NEXT_PUBLIC_META_PIXEL_ID overrides it, e.g. "off" switches the pixel off:
// anything that is not digits = off, and the cookie banner then does not ask
// for marketing consent. NEXT_PUBLIC_*: baked in at build time, so a change
// needs a new deploy.
const DEFAULT_PIXEL_ID = "2014480182477964"
const PIXEL_ID_PATTERN = /^\d{6,20}$/
const configuredPixelId = (
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? DEFAULT_PIXEL_ID
).trim()

export const META_PIXEL_ID = PIXEL_ID_PATTERN.test(configuredPixelId)
  ? configuredPixelId
  : null
