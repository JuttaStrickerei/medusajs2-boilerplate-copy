import type { CookieConsentConfig } from "vanilla-cookieconsent"
import { updateGoogleConsentMode } from "./consent-mode"

/** Consent version for audit trail. Increment when privacy policy changes. */
export const CONSENT_VERSION = "1.0"

/**
 * Austrian/GDPR-compliant cookie consent configuration.
 * Defaults: ALL non-essential cookies OFF (no pre-ticked boxes).
 * Equal prominence: "Reject All" same level as "Accept All".
 * Consent expiry: 365 days (12 months).
 */
export const cookieConsentConfig: CookieConsentConfig = {
  revision: 1,

  cookie: {
    name: "cc_consent",
    expiresAfterDays: 365,
    sameSite: "Strict",
    useLocalStorage: false,
  },

  guiOptions: {
    consentModal: {
      layout: "box inline",
      position: "bottom left",
      equalWeightButtons: true, // Austrian law: Reject must be equal to Accept
      flipButtons: false,
    },
    preferencesModal: {
      layout: "box",
      equalWeightButtons: true,
      flipButtons: true,
    },
  },

  onFirstConsent: ({ cookie }) => {
    // Log consent with timestamp and version for DSB audit trail
    console.info("[CookieConsent] First consent recorded:", {
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
      categories: cookie.categories,
    })
  },

  onConsent: ({ cookie }) => {
    const analyticsGranted = cookie.categories.includes("analytics")
    const marketingGranted = cookie.categories.includes("marketing")

    // Update Google Consent Mode v2
    updateGoogleConsentMode(analyticsGranted, marketingGranted)

    // Load GA4 only if analytics consent given
    if (analyticsGranted) {
      loadGoogleAnalytics()
    }

    // Mailchimp tracking only if marketing consent given
    if (marketingGranted) {
      loadMailchimpTracking()
    }
  },

  onChange: ({ cookie, changedCategories }) => {
    const analyticsGranted = cookie.categories.includes("analytics")
    const marketingGranted = cookie.categories.includes("marketing")

    updateGoogleConsentMode(analyticsGranted, marketingGranted)

    if (changedCategories.includes("analytics")) {
      if (analyticsGranted) {
        loadGoogleAnalytics()
      } else {
        removeGoogleAnalyticsCookies()
      }
    }

    if (changedCategories.includes("marketing")) {
      if (!marketingGranted) {
        removeMailchimpCookies()
      }
    }
  },

  categories: {
    necessary: {
      enabled: true,
      readOnly: true, // Cannot be turned off
    },
    functional: {
      enabled: false,
    },
    analytics: {
      enabled: false,
      autoClear: {
        cookies: [
          { name: /^_ga/ },
          { name: "_gid" },
          { name: "_gat" },
          { name: /^_gac_/ },
        ],
      },
    },
    marketing: {
      enabled: false,
      autoClear: {
        cookies: [
          { name: /^mc_/ }, // Mailchimp
          { name: "mailchimp_landing_site" },
        ],
      },
    },
  },

  language: {
    default: "de",
    autoDetect: "browser",
    translations: {
      de: {
        consentModal: {
          title: "Wir verwenden Cookies 🍪",
          description:
            'Wir verwenden Cookies und ähnliche Technologien auf unserer Website. Einige davon sind technisch notwendig, andere helfen uns, unser Angebot zu verbessern oder Ihnen relevante Inhalte anzuzeigen. Sie können Ihre Auswahl jederzeit unter <button type="button" data-cc="show-preferencesModal" class="cc__link">Einstellungen</button> anpassen. Weitere Informationen finden Sie in unserer <a href="/privacy" class="cc__link">Datenschutzerklärung</a> und unserem <a href="/imprint" class="cc__link">Impressum</a>.',
          acceptAllBtn: "Alle akzeptieren",
          acceptNecessaryBtn: "Nur notwendige",
          showPreferencesBtn: "Einstellungen verwalten",
          footer:
            '<a href="/privacy">Datenschutz</a> | <a href="/imprint">Impressum</a>',
        },
        preferencesModal: {
          title: "Cookie-Einstellungen",
          acceptAllBtn: "Alle akzeptieren",
          acceptNecessaryBtn: "Nur notwendige",
          savePreferencesBtn: "Auswahl speichern",
          closeIconLabel: "Schließen",
          serviceCounterLabel: "Dienst|Dienste",
          sections: [
            {
              title: "Ihre Privatsphäre",
              description:
                "Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. Weitere Informationen finden Sie in unserer <a href='/privacy' class='cc__link'>Datenschutzerklärung</a>.",
            },
            {
              title:
                "Technisch notwendige Cookies <span class='pm__badge'>Immer aktiv</span>",
              description:
                "Diese Cookies sind für den Betrieb der Website unbedingt erforderlich. Dazu zählen Session-Cookies, Warenkorb-Daten sowie die sichere Zahlungsabwicklung über Stripe. Diese Cookies können nicht deaktiviert werden.",
              linkedCategory: "necessary",
              cookieTable: {
                caption: "Cookie-Tabelle",
                headers: {
                  name: "Name",
                  domain: "Domain",
                  desc: "Beschreibung",
                  exp: "Ablauf",
                },
                body: [
                  {
                    name: "cc_consent",
                    domain: typeof window !== "undefined" ? location.hostname : "",
                    desc: "Speichert Ihre Cookie-Einstellungen",
                    exp: "12 Monate",
                  },
                  {
                    name: "_medusa_cart_id",
                    domain: typeof window !== "undefined" ? location.hostname : "",
                    desc: "Warenkorb-Verwaltung",
                    exp: "Session",
                  },
                  {
                    name: "_medusa_region",
                    domain: typeof window !== "undefined" ? location.hostname : "",
                    desc: "Regionseinstellung",
                    exp: "Session",
                  },
                  {
                    name: "__stripe_mid",
                    domain: "stripe.com",
                    desc: "Stripe – Betrugsprävention (notwendig für Zahlung)",
                    exp: "1 Jahr",
                  },
                  {
                    name: "__stripe_sid",
                    domain: "stripe.com",
                    desc: "Stripe – Session-Sicherheit",
                    exp: "30 Minuten",
                  },
                ],
              },
            },
            {
              title: "Funktionale Cookies",
              description:
                "Diese Cookies ermöglichen erweiterte Funktionen wie gespeicherte Spracheinstellungen oder Merkzettel.",
              linkedCategory: "functional",
            },
            {
              title: "Analyse-Cookies",
              description:
                "Diese Cookies helfen uns zu verstehen, wie Besucher unsere Website nutzen. Alle Daten werden anonymisiert ausgewertet. Wir verwenden Google Analytics 4. Da Google Analytics Daten in die USA überträgt, erfolgt diese Verarbeitung nur mit Ihrer ausdrücklichen Einwilligung (Art. 49 Abs. 1 lit. a DSGVO).",
              linkedCategory: "analytics",
              cookieTable: {
                caption: "Cookie-Tabelle",
                headers: {
                  name: "Name",
                  domain: "Domain",
                  desc: "Beschreibung",
                  exp: "Ablauf",
                },
                body: [
                  {
                    name: "_ga",
                    domain: "google.com",
                    desc: "Google Analytics – Nutzeridentifikation",
                    exp: "2 Jahre",
                  },
                  {
                    name: "_gid",
                    domain: "google.com",
                    desc: "Google Analytics – Session-Unterscheidung",
                    exp: "24 Stunden",
                  },
                  {
                    name: "_gat",
                    domain: "google.com",
                    desc: "Google Analytics – Anfragebegrenzung",
                    exp: "1 Minute",
                  },
                ],
              },
            },
            {
              title: "Marketing-Cookies",
              description:
                "Diese Cookies werden verwendet, um Ihnen relevante Werbung anzuzeigen und Newsletter-Kampagnen auszuwerten (Mailchimp). Diese Verarbeitung kann eine Übertragung Ihrer Daten in die USA beinhalten und erfolgt nur mit Ihrer ausdrücklichen Einwilligung.",
              linkedCategory: "marketing",
              cookieTable: {
                caption: "Cookie-Tabelle",
                headers: {
                  name: "Name",
                  domain: "Domain",
                  desc: "Beschreibung",
                  exp: "Ablauf",
                },
                body: [
                  {
                    name: "mc_*",
                    domain: "mailchimp.com",
                    desc: "Mailchimp – Kampagnenverfolgung",
                    exp: "Bis zu 2 Jahre",
                  },
                ],
              },
            },
            {
              title: "Weitere Informationen",
              description:
                'Bei Fragen zu unserer Cookie-Richtlinie kontaktieren Sie uns bitte unter <a href="mailto:office@strickerei-jutta.at" class="cc__link">office@strickerei-jutta.at</a>.',
            },
          ],
        },
      },

      en: {
        consentModal: {
          title: "We use cookies 🍪",
          description:
            'We use cookies and similar technologies on our website. Some are technically necessary, others help us improve our offering. You can change your selection at any time in the <button type="button" data-cc="show-preferencesModal" class="cc__link">Settings</button>. For more information, see our <a href="/privacy" class="cc__link">Privacy Policy</a> and <a href="/imprint" class="cc__link">Imprint</a>.',
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Necessary only",
          showPreferencesBtn: "Manage preferences",
          footer:
            '<a href="/privacy">Privacy</a> | <a href="/imprint">Imprint</a>',
        },
        preferencesModal: {
          title: "Cookie Preferences",
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Necessary only",
          savePreferencesBtn: "Save preferences",
          closeIconLabel: "Close",
          serviceCounterLabel: "Service|Services",
          sections: [
            {
              title: "Your Privacy",
              description:
                "We use cookies to give you the best experience on our website. See our <a href='/privacy' class='cc__link'>Privacy Policy</a> for more information.",
            },
            {
              title:
                "Strictly Necessary <span class='pm__badge'>Always active</span>",
              description:
                "These cookies are required for the website to function, including session management, cart data and secure Stripe payment processing. These cookies cannot be disabled.",
              linkedCategory: "necessary",
              cookieTable: {
                caption: "Cookie Table",
                headers: {
                  name: "Name",
                  domain: "Domain",
                  desc: "Description",
                  exp: "Expiry",
                },
                body: [
                  {
                    name: "cc_consent",
                    domain: typeof window !== "undefined" ? location.hostname : "",
                    desc: "Stores your cookie preferences",
                    exp: "12 months",
                  },
                  {
                    name: "_medusa_cart_id",
                    domain: typeof window !== "undefined" ? location.hostname : "",
                    desc: "Cart management",
                    exp: "Session",
                  },
                  {
                    name: "_medusa_region",
                    domain: typeof window !== "undefined" ? location.hostname : "",
                    desc: "Region settings",
                    exp: "Session",
                  },
                  {
                    name: "__stripe_mid",
                    domain: "stripe.com",
                    desc: "Stripe – Fraud prevention (required for payment)",
                    exp: "1 year",
                  },
                  {
                    name: "__stripe_sid",
                    domain: "stripe.com",
                    desc: "Stripe – Session security",
                    exp: "30 minutes",
                  },
                ],
              },
            },
            {
              title: "Functional",
              description:
                "Cookies that enable enhanced functionality such as saved language preferences or wishlists.",
              linkedCategory: "functional",
            },
            {
              title: "Analytics",
              description:
                "These cookies help us understand how visitors use our site via Google Analytics 4. As Google may process data in the USA, this requires your explicit consent (Art. 49(1)(a) GDPR).",
              linkedCategory: "analytics",
              cookieTable: {
                caption: "Cookie Table",
                headers: {
                  name: "Name",
                  domain: "Domain",
                  desc: "Description",
                  exp: "Expiry",
                },
                body: [
                  {
                    name: "_ga",
                    domain: "google.com",
                    desc: "Google Analytics – User identification",
                    exp: "2 years",
                  },
                  {
                    name: "_gid",
                    domain: "google.com",
                    desc: "Google Analytics – Session differentiation",
                    exp: "24 hours",
                  },
                  {
                    name: "_gat",
                    domain: "google.com",
                    desc: "Google Analytics – Rate limiting",
                    exp: "1 minute",
                  },
                ],
              },
            },
            {
              title: "Marketing",
              description:
                "These cookies are used for Mailchimp campaign tracking. Data may be transferred to the USA and requires your explicit consent.",
              linkedCategory: "marketing",
              cookieTable: {
                caption: "Cookie Table",
                headers: {
                  name: "Name",
                  domain: "Domain",
                  desc: "Description",
                  exp: "Expiry",
                },
                body: [
                  {
                    name: "mc_*",
                    domain: "mailchimp.com",
                    desc: "Mailchimp – Campaign tracking",
                    exp: "Up to 2 years",
                  },
                ],
              },
            },
            {
              title: "More Information",
              description:
                'For questions about our cookie policy, please contact us at <a href="mailto:office@strickerei-jutta.at" class="cc__link">office@strickerei-jutta.at</a>.',
            },
          ],
        },
      },
    },
  },
}

// --- Helper functions ---

function loadGoogleAnalytics(): void {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID
  if (!GA_ID || document.getElementById("ga-script")) return

  const script = document.createElement("script")
  script.id = "ga-script"
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  script.onload = () => {
    window.dataLayer = window.dataLayer || []
    function gtag(...args: unknown[]): void {
      window.dataLayer.push(args)
    }
    gtag("js", new Date())
    gtag("config", GA_ID, {
      anonymize_ip: true,
      send_page_view: true,
    })
  }
}

function removeGoogleAnalyticsCookies(): void {
  if (typeof window === "undefined") return

  const domain = location.hostname
  ;["_ga", "_gid", "_gat"].forEach((name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`
  })
}

function loadMailchimpTracking(): void {
  // Add Mailchimp tracking pixel or SDK initialization here if applicable
  // Example: window._mfq = window._mfq || [];
}

function removeMailchimpCookies(): void {
  if (typeof window === "undefined") return

  const domain = location.hostname
  document.cookie = `mc_=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`
}
