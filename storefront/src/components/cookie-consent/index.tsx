"use client"

import { useEffect } from "react"
import "vanilla-cookieconsent/dist/cookieconsent.css"
import type { CookieConsentConfig } from "vanilla-cookieconsent"

const config: CookieConsentConfig = {
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
  },

  onConsent: ({ cookie }) => {
    if (cookie.categories.includes("analytics")) {
      gtag("consent", "update", { analytics_storage: "granted" })
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
            'Wir verwenden Cookies und ähnliche Technologien. Einige sind technisch notwendig (z.\u00a0B. Warenkorb, Session), andere helfen uns, unsere Website zu verbessern. Sie können Ihre Auswahl jederzeit in den <button type="button" data-cc="show-preferencesModal" class="cc__link">Einstellungen</button> anpassen. Weitere Informationen finden Sie in unserer <a href="/at/privacy" class="cc__link">Datenschutzerklärung</a>.',
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
