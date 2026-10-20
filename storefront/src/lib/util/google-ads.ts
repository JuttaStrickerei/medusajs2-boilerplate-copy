import { hasConsentFor } from "./consent"
import { GOOGLE_ADS_ID, GOOGLE_ADS_PURCHASE_LABEL } from "./google-ads-id"
import { loadGtagScript } from "./google-analytics"
import { MARKETING_CATEGORY } from "./meta-pixel"

/**
 * Google Ads tag behind the "marketing" category of the cookie banner (the
 * same consent as the Meta Pixel). Consent Mode v2: app/layout.tsx sets all
 * four signals to "denied" by default; only marketing consent grants the
 * three ad signals, so Google Ads can count purchases (ad_storage,
 * ad_user_data) and build remarketing lists (ad_personalization) – also via
 * the GA4 ↔ Google Ads link. The Google Ads tag itself (and the "Kauf"
 * conversion) only loads with NEXT_PUBLIC_GOOGLE_ADS_ID.
 */

let adsLoaded = false

export function enableGoogleAds(): void {
  if (typeof window === "undefined" || typeof gtag !== "function") return
  // Immer: GA4 ist mit Google Ads verknüpft und braucht die Werbesignale
  gtag("consent", "update", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  })
  if (!GOOGLE_ADS_ID || adsLoaded) return
  adsLoaded = true
  loadGtagScript(GOOGLE_ADS_ID)
  gtag("config", GOOGLE_ADS_ID)
}

// Withdrawal also reloads the page (cookie banner autoClear)
export function disableGoogleAds(): void {
  if (typeof window === "undefined" || typeof gtag !== "function") return
  gtag("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  })
}

/**
 * "Kauf" conversion on the order confirmation page. transaction_id = the
 * same order id as GA4 and the Meta Pixel, so Google Ads counts an order once
 * even if the page is opened twice.
 */
export function trackGoogleAdsPurchase(params: Record<string, unknown>): void {
  if (
    typeof window === "undefined" ||
    !GOOGLE_ADS_ID ||
    !GOOGLE_ADS_PURCHASE_LABEL ||
    !hasConsentFor(MARKETING_CATEGORY)
  ) {
    return
  }
  // Shop events can fire before the banner script has run (saved consent)
  enableGoogleAds()
  gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
    value: params.value,
    currency: params.currency,
    transaction_id: params.transaction_id,
  })
}
