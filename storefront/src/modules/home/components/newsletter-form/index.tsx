"use client"

import { subscribeToNewsletter } from "@lib/data/newsletter"
import { Button } from "@components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState } from "react"
import { toast } from "@medusajs/ui"

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await subscribeToNewsletter(email)
      toast.success("Vielen Dank für Ihre Anmeldung!")
      setEmail("")
    } catch (error) {
      console.error(error)
      toast.error("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.")
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

