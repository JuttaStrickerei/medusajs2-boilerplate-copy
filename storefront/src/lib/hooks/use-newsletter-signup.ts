"use client"

import { subscribeToNewsletter } from "@lib/data/newsletter"
import { trackNewsletterSignup } from "@lib/util/analytics"
import { useState } from "react"

export type NewsletterStatus = "idle" | "success" | "already_subscribed" | "not_subscribed" | "error"

// Merkt sich, dass der Newsletter-Hinweis für diese Besucherin erledigt ist, und wie lange
// er ausbleibt. Im Speicher des Browsers (Local Storage) steht nur der Grund und das Ende
// der Pause, nichts über die Person.
//   geschlossen: 30 Tage, danach darf er noch einmal kommen
//   angemeldet:  angemeldet, schon angemeldet oder mit Gutschein-Link gekommen
//   newsletter:  über einen Link aus einer unserer E-Mails gekommen (Stammkundin)
export type NewsletterTeaserReason = "geschlossen" | "angemeldet" | "newsletter"
const TEASER_KEY = "jutta_newsletter_hinweis"
const DAY_MS = 24 * 60 * 60 * 1000
const PAUSE_DAYS: Record<NewsletterTeaserReason, number> = {
  geschlossen: 30,
  angemeldet: 730,
  newsletter: 730,
}
let teaserHandled = false

export function isNewsletterTeaserHandled(): boolean {
  if (teaserHandled) return true
  try {
    const saved = JSON.parse(window.localStorage.getItem(TEASER_KEY) || "null")
    return typeof saved?.bis === "number" && Date.now() < saved.bis
  } catch {
    return false
  }
}

export function markNewsletterTeaserHandled(reason: NewsletterTeaserReason) {
  teaserHandled = true
  try {
    // Eine längere Pause wird nicht durch eine kürzere ersetzt (erst angemeldet, dann geschlossen)
    const saved = JSON.parse(window.localStorage.getItem(TEASER_KEY) || "null")
    const bis = Date.now() + PAUSE_DAYS[reason] * DAY_MS
    if (typeof saved?.bis === "number" && saved.bis > bis) return
    window.localStorage.setItem(TEASER_KEY, JSON.stringify({ grund: reason, bis }))
  } catch {
    // Speicher gesperrt (z. B. privates Fenster): Dann gilt der Merker bis zum Neuladen
  }
}

/** Kommt die Besucherin über einen Link aus unseren E-Mails (Newsletter, Shop-Mails)? */
export function cameFromOurEmail(search: string): boolean {
  const params = new URLSearchParams(search)
  return (
    params.get("utm_source")?.toLowerCase() === "newsletter" ||
    params.get("utm_medium")?.toLowerCase() === "email"
  )
}

/** Anmeldung zum Newsletter für die kleinen Formulare (Fußzeile, Hinweis). Texte kommen vom Backend. */
export function useNewsletterSignup() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<NewsletterStatus>("idle")
  const [message, setMessage] = useState("")
  // Link zum Anmeldeformular von Mailchimp, wenn die Adresse dort abgemeldet ist
  const [signupUrl, setSignupUrl] = useState<string | null>(null)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setStatus("idle")
    setMessage("")
    setSignupUrl(null)

    try {
      const result = await subscribeToNewsletter(email)

      if (!result.success) {
        setStatus("error")
        setMessage(result.message || "Ein Fehler ist aufgetreten.")
      } else if (result.alreadySubscribed) {
        setStatus("already_subscribed")
        setMessage(result.message || "Sie sind schon bei unserem Newsletter dabei, danke!")
        markNewsletterTeaserHandled("angemeldet")
      } else if (result.notSubscribed) {
        setStatus("not_subscribed")
        setMessage(result.message || "Diese Adresse ist bei unserem Newsletter derzeit nicht angemeldet.")
        setSignupUrl(result.signupUrl || null)
        markNewsletterTeaserHandled("geschlossen")
      } else {
        setStatus("success")
        setMessage(
          result.message ||
            "Vielen Dank für Ihre Anmeldung! Sie erhalten in Kürze eine Bestätigungs-E-Mail."
        )
        setEmail("")
        markNewsletterTeaserHandled("angemeldet")
        trackNewsletterSignup()
      }
    } catch {
      setStatus("error")
      setMessage(
        "Das hat leider nicht geklappt. Bitte prüfen Sie Ihre E-Mail-Adresse und versuchen Sie es noch einmal."
      )
    } finally {
      setLoading(false)
    }
  }

  return { email, setEmail, loading, status, message, signupUrl, submit }
}
