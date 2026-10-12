"use client"

import { useEffect } from "react"
import "vanilla-cookieconsent/dist/cookieconsent.css"
import type { CookieConsentConfig } from "vanilla-cookieconsent"
import { CONSENT_REVISION } from "@lib/util/consent"
import {
  disableMetaPixel,
  enableMetaPixel,
  MARKETING_CATEGORY,
} from "@lib/util/meta-pixel"
import { META_PIXEL_ID } from "@lib/util/meta-pixel-id"

// Die Kategorie „Marketing“ gibt es nur, wenn ein Meta-Pixel eingerichtet ist
const hasMarketing = !!META_PIXEL_ID

// fbevents.js legt _fbp/_fbc auf der Hauptdomain an (.strickerei-jutta.at statt
// shop.strickerei-jutta.at). Gelöscht wird daher dort und auf dem Host selbst.
const pixelCookieDomain = (): string | undefined => {
  if (typeof window === "undefined") return undefined
  const parts = window.location.hostname.split(".")
  return parts.length > 2 ? `.${parts.slice(-2).join(".")}` : undefined
}

const pixelCookies = (domain = pixelCookieDomain()) =>
  ["_fbp", "_fbc"].flatMap((name) => [
    { name },
    ...(domain ? [{ name, domain }] : []),
  ])

const marketingSection = {
  title: "Marketing-Cookies",
  description:
    "Mit dem Meta-Pixel messen wir, wie gut unsere Werbung auf Facebook und Instagram wirkt, und können Ihnen dort passende Anzeigen zeigen. Dazu übermittelt Ihr Browser Angaben zu Ihrem Besuch (z. B. angesehene Produkte, Warenkorb und Kauf) an Meta Platforms Ireland Ltd. Meta kann diese Daten auch in den USA verarbeiten und mit Ihrem Facebook- oder Instagram-Konto verknüpfen. Das geschieht nur mit Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie jederzeit widerrufen können.",
  linkedCategory: MARKETING_CATEGORY,
  cookieTable: {
    caption: "Marketing-Cookies",
    headers: {
      name: "Name",
      domain: "Domain",
      desc: "Beschreibung",
      exp: "Ablauf",
    },
    body: [
      {
        name: "_fbp",
        domain: "strickerei-jutta.at",
        desc: "Meta-Pixel – Wiedererkennung des Browsers",
        exp: "3 Monate",
      },
      {
        name: "_fbc",
        domain: "strickerei-jutta.at",
        desc: "Meta-Pixel – Klick auf eine Anzeige (nur nach einem solchen Klick)",
        exp: "3 Monate",
      },
    ],
  },
}

const config: CookieConsentConfig = {
  // Neue Kategorie = neue Einwilligung: Das Banner erscheint dann noch einmal
  revision: CONSENT_REVISION,

  categories: {
    necessary: {
      enabled: true,
      readOnly: true,
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
    ...(hasMarketing
      ? {
          [MARKETING_CATEGORY]: {
            enabled: false,
            // Neu laden, damit das Pixel-Skript nach dem Widerruf weg ist
            autoClear: {
              cookies: pixelCookies(),
              reloadPage: true,
            },
          },
        }
      : {}),
  },

  onConsent: ({ cookie }) => {
    if (cookie.categories.includes("analytics")) {
      gtag("consent", "update", { analytics_storage: "granted" })
    }
    if (cookie.categories.includes(MARKETING_CATEGORY)) {
      enableMetaPixel()
    }
  },

  onChange: ({ cookie, changedCategories }) => {
    if (changedCategories.includes("analytics")) {
      gtag("consent", "update", {
        analytics_storage: cookie.categories.includes("analytics")
          ? "granted"
          : "denied",
      })
    }
    if (changedCategories.includes(MARKETING_CATEGORY)) {
      if (cookie.categories.includes(MARKETING_CATEGORY)) {
        enableMetaPixel()
      } else {
        disableMetaPixel()
      }
    }
  },

  guiOptions: {
    consentModal: {
      layout: "bar inline",
      position: "bottom",
      equalWeightButtons: true,
      flipButtons: false,
    },
    preferencesModal: {
      layout: "box",
      equalWeightButtons: true,
      flipButtons: false,
    },
  },

  language: {
    default: "de",
    translations: {
      de: {
        consentModal: {
          title: "Wir verwenden Cookies",
          description:
            `Wir verwenden Cookies und ähnliche Technologien. Einige sind technisch notwendig (z.\u00a0B. Warenkorb, Session), andere helfen uns, unsere Website zu verbessern${
            hasMarketing
              ? " und die Wirkung unserer Werbung auf Facebook und Instagram zu messen"
              : ""
          }. Sie können Ihre Auswahl jederzeit in den <button type="button" data-cc="show-preferencesModal" class="cc__link">Einstellungen</button> anpassen. Weitere Informationen finden Sie in unserer <a href="/at/privacy" class="cc__link">Datenschutzerklärung</a>.`,
          acceptAllBtn: "Alle akzeptieren",
          acceptNecessaryBtn: "Nur notwendige",
          showPreferencesBtn: "Einstellungen",
        },
        preferencesModal: {
          title: "Cookie-Einstellungen",
          acceptAllBtn: "Alle akzeptieren",
          acceptNecessaryBtn: "Nur notwendige",
          savePreferencesBtn: "Auswahl speichern",
          closeIconLabel: "Schließen",
          sections: [
            {
              title: "Ihre Privatsphäre",
              description:
                "Wir respektieren Ihre Privatsphäre. Hier können Sie auswählen, welche Cookies Sie zulassen möchten. Weitere Informationen finden Sie in unserer <a href='/at/privacy' class='cc__link'>Datenschutzerklärung</a>.",
            },
            {
              title:
                'Notwendige Cookies <span class="pm__badge">Immer aktiv</span>',
              description:
                "Diese Cookies sind für den Betrieb der Website unbedingt erforderlich. Dazu gehören Session-Cookies und Warenkorb-Daten. Sie können nicht deaktiviert werden.",
              linkedCategory: "necessary",
            },
            {
              title: "Analyse-Cookies",
              description:
                "Diese Cookies helfen uns zu verstehen, wie Besucher unsere Website nutzen. Wir verwenden Google Analytics 4, wobei alle Daten anonymisiert erhoben werden. Da Google Daten in die USA übertragen kann, erfolgt dies nur mit Ihrer ausdrücklichen Einwilligung (Art.\u00a049 Abs.\u00a01 lit.\u00a0a DSGVO).",
              linkedCategory: "analytics",
              cookieTable: {
                caption: "Analyse-Cookies",
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
                ],
              },
            },
            ...(hasMarketing ? [marketingSection] : []),
            {
              title: "Weitere Informationen",
              description:
                'Bei Fragen zu unserer Cookie-Richtlinie kontaktieren Sie uns bitte unter <a href="mailto:office@strickerei-jutta.at" class="cc__link">office@strickerei-jutta.at</a>.',
            },
          ],
        },
      },
    },
  },
}

export default function CookieConsent() {
  useEffect(() => {
    import("vanilla-cookieconsent").then((cc) => {
      cc.run(config)
    })
  }, [])

  return null
}
