"use client"

import { subscribeToNewsletter } from "@lib/data/newsletter"
import { Button } from "@components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState } from "react"
import { toast } from "@medusajs/ui"

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "already_subscribed" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setStatus("idle")
    setMessage("")
    
    try {
      const result = await subscribeToNewsletter(email)
      
      if (result.success) {
        if (result.alreadySubscribed) {
          setStatus("already_subscribed")
          setMessage("Sie haben sich bereits online oder in der Strickerei für den Newsletter angemeldet. Wir freuen uns, dass Sie dabei sind!")
        } else {
          setStatus("success")
          setMessage("Vielen Dank für Ihre Anmeldung! Sie erhalten in Kürze eine Bestätigungs-E-Mail.")
          setEmail("")
          toast.success("Vielen Dank für Ihre Anmeldung!")
        }
      } else {
        setStatus("error")
        setMessage(result.message || "Ein Fehler ist aufgetreten.")
        toast.error(result.message || "Ein Fehler ist aufgetreten.")
      }
    } catch (error) {
      console.error(error)
      setStatus("error")
      setMessage("Bitte geben Sie eine gültige E-Mail-Adresse ein. Falls Sie sicher sind, dass Ihre Adresse korrekt ist, kontaktieren Sie uns bitte über unser Kontaktformular. Wir helfen Ihnen gerne weiter!")
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="font-serif text-3xl small:text-4xl font-medium">
        Bleiben Sie informiert
      </h2>
      <p className="text-stone-300 leading-relaxed">
        Erhalten Sie exklusive Einblicke in neue Kollektionen, 
        Pflegetipps für Ihre Strickwaren und besondere Angebote.
      </p>
      
      {/* Status Messages */}
      {status === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg max-w-md mx-auto">
          {message}
        </div>
      )}
      
      {status === "already_subscribed" && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg max-w-md mx-auto">
          {message}
        </div>
      )}
      
      {status === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg max-w-md mx-auto">
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col small:flex-row gap-3 max-w-md mx-auto pt-4">
        <input
          type="email"
          placeholder="Ihre E-Mail-Adresse"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-lg bg-stone-700 border border-stone-600 text-white placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors disabled:opacity-50"
        />
        <Button 
          type="submit" 
          className="bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Wird gesendet..." : "Anmelden"}
        </Button>
      </form>
      <p className="text-xs text-stone-500">
        Mit der Anmeldung stimmen Sie unseren{" "}
        <LocalizedClientLink href="/privacy" className="underline hover:text-white">
          Datenschutzrichtlinien
        </LocalizedClientLink>{" "}
        zu.
      </p>
    </div>
  )
}

