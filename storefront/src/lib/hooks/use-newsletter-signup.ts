"use client"

import { subscribeToNewsletter } from "@lib/data/newsletter"
import { useState } from "react"

export type NewsletterStatus = "idle" | "success" | "already_subscribed" | "error"

// Merkt für diesen Besuch, dass der Newsletter-Hinweis geschlossen oder die Anmeldung
// erledigt ist. Nur im Sitzungsspeicher des Browsers: Mit dem Schließen des Fensters ist
// der Eintrag weg, es wird nichts über die Person gespeichert.
const TEASER_KEY = "jutta_newsletter_hinweis"
let teaserHandled = false

export function isNewsletterTeaserHandled(): boolean {
  if (teaserHandled) return true
  try {
    return window.sessionStorage.getItem(TEASER_KEY) !== null
  } catch {
    return false
  }
}

export function markNewsletterTeaserHandled(reason: "geschlossen" | "angemeldet") {
  teaserHandled = true
  try {
    window.sessionStorage.setItem(TEASER_KEY, reason)
  } catch {
    // Speicher gesperrt (z. B. privates Fenster): Dann gilt der Merker bis zum Neuladen
  }
}

/** Anmeldung zum Newsletter für die kleinen Formulare (Fußzeile, Hinweis). Texte kommen vom Backend. */
export function useNewsletterSignup() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<NewsletterStatus>("idle")
  const [message, setMessage] = useState("")

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      const result = await subscribeToNewsletter(email)

      if (!result.success) {
        setStatus("error")
        setMessage(result.message || "Ein Fehler ist aufgetreten.")
      } else if (result.alreadySubscribed) {
        setStatus("already_subscribed")
        setMessage(result.message || "Sie sind bereits für den Newsletter angemeldet.")
        markNewsletterTeaserHandled("angemeldet")
      } else {
        setStatus("success")
        setMessage(
          result.message ||
            "Vielen Dank für Ihre Anmeldung! Sie erhalten in Kürze eine Bestätigungs-E-Mail."
        )
        setEmail("")
        markNewsletterTeaserHandled("angemeldet")
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

  return { email, setEmail, loading, status, message, submit }
}
