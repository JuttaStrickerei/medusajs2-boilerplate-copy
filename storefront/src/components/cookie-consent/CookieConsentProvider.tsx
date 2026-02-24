"use client"

import { useEffect } from "react"
import { cookieConsentConfig } from "@lib/cookie-consent-config"
import { initGoogleConsentMode } from "@lib/consent-mode"

/**
 * Cookie Consent Provider
 *
 * Client component that initializes:
 * 1. Google Consent Mode v2 (MUST run before any gtag script loads)
 * 2. Vanilla Cookie Consent with Austrian/GDPR-compliant settings
 *
 * No visible DOM output - banner is injected by the library.
 */
export default function CookieConsentProvider(): null {
  useEffect(() => {
    // 1. Initialize Google Consent Mode v2 FIRST — before any gtag loads
    // This sets default consent state to "denied" for all categories
    initGoogleConsentMode()

    // 2. Dynamically import and run cookie consent manager
    // This avoids SSR issues with the library
    import("vanilla-cookieconsent").then((CookieConsent) => {
      CookieConsent.run(cookieConsentConfig)
    })
  }, [])

  return null
}
