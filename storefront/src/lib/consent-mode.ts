/**
 * Google Consent Mode v2 Implementation
 * Initializes consent state with all denied before any gtag/GA script loads.
 * This is required for Austrian/GDPR compliance.
 *
 * @see https://developers.google.com/tag-platform/security/guides/consent
 */

export function initGoogleConsentMode(): void {
  if (typeof window === "undefined") return

  window.dataLayer = window.dataLayer || []
  function gtag(...args: unknown[]): void {
    window.dataLayer.push(args)
  }

  // Set default consent state — all denied
  // This MUST run before any Google script loads
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted", // Required for Stripe fraud detection
    wait_for_update: 500,
  })

  gtag("set", "ads_data_redaction", true)
  gtag("set", "url_passthrough", true)
}

export function updateGoogleConsentMode(
  analyticsGranted: boolean,
  marketingGranted: boolean
): void {
  if (typeof window === "undefined") return

  window.dataLayer = window.dataLayer || []
  function gtag(...args: unknown[]): void {
    window.dataLayer.push(args)
  }

  gtag("consent", "update", {
    analytics_storage: analyticsGranted ? "granted" : "denied",
    ad_storage: marketingGranted ? "granted" : "denied",
    ad_user_data: marketingGranted ? "granted" : "denied",
    ad_personalization: marketingGranted ? "granted" : "denied",
    functionality_storage: analyticsGranted ? "granted" : "denied",
    personalization_storage: marketingGranted ? "granted" : "denied",
  })
}
