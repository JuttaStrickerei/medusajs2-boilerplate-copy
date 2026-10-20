// Google Ads conversion ID ("AW-123456789", Google Ads → Ziele → Conversions →
// Kauf → Tag einrichten) and the label of the "Kauf" conversion action.
// Both public anyway (they are in every page once consent is given).
// Unset = no Google Ads tag, and the "marketing" consent covers Meta only.
// NEXT_PUBLIC_*: baked in at build time, so a change needs a new deploy.
const ADS_ID_PATTERN = /^AW-\d{6,15}$/
const configuredAdsId = (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "").trim()

export const GOOGLE_ADS_ID = ADS_ID_PATTERN.test(configuredAdsId)
  ? configuredAdsId
  : null

export const GOOGLE_ADS_PURCHASE_LABEL =
  (process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL ?? "").trim() || null
