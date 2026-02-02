"use client"

import { useState } from "react"
import { sdk } from "@lib/config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")
    
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    }
    
    try {
      const result = await sdk.client.fetch<{ success: boolean; message?: string; errors?: unknown }>(`/store/contact`, {
        method: "POST",
        body: data,
      })
      
      if (result.success) {
        setSubmitStatus("success")
        form.reset()
      } else {
        setErrorMessage(result.message || "Fehler beim Senden")
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("Contact form error:", error)
      setErrorMessage("Netzwerkfehler. Bitte versuchen Sie es später erneut.")
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitStatus === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.
        </div>
      )}
      
      {submitStatus === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 small:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-stone-800 mb-2">Vorname *</label>
          <input 
            type="text" 
            name="firstName"
            required 
            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-800 mb-2">Nachname *</label>
          <input 
            type="text" 
            name="lastName"
            required 
            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 outline-none transition-all"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-stone-800 mb-2">E-Mail-Adresse *</label>
        <input 
          type="email" 
          name="email"
          required 
          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 outline-none transition-all"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-stone-800 mb-2">Telefonnummer</label>
        <input 
          type="tel" 
          name="phone"
          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 outline-none transition-all"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-stone-800 mb-2">Betreff *</label>
        <select 
          name="subject"
          required 
          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 outline-none transition-all"
        >
          <option value="">Bitte wählen...</option>
          <option value="Produktanfrage">Produktanfrage</option>
          <option value="Maßanfertigung">Maßanfertigung</option>
          <option value="Pflegehinweise">Pflegehinweise</option>
          <option value="Rückgabe/Umtausch">Rückgabe/Umtausch</option>
          <option value="Sonstiges">Sonstiges</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-stone-800 mb-2">Nachricht *</label>
        <textarea 
          name="message"
          required 
          rows={6} 
          minLength={10}
          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 outline-none transition-all resize-none"
          placeholder="Teilen Sie uns Ihr Anliegen mit..."
        />
      </div>
      
      <div className="flex items-start space-x-3">
        <input type="checkbox" id="privacy" required className="mt-1" />
        <label htmlFor="privacy" className="text-sm text-stone-600">
          Ich stimme der Verarbeitung meiner Daten gemäß der{" "}
          <LocalizedClientLink href="/privacy" className="text-stone-800 underline hover:no-underline">
            Datenschutzerklärung
          </LocalizedClientLink>{" "}
          zu. *
        </label>
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-stone-800 text-white py-4 rounded-lg font-medium hover:bg-stone-700 transition-colors disabled:bg-stone-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Wird gesendet..." : "Nachricht senden"}
      </button>
    </form>
  )
}

