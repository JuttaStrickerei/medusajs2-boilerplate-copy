"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Spinner } from "@medusajs/ui"
import { sdk } from "@lib/config"

/**
 * @name CompletePaymentPage
 * @description Loading page for completing off-site payments (PayPal, 3D Secure).
 * Shows a graceful loading state while the cart is being completed.
 */
export default function CompletePaymentPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [errorMessage, setErrorMessage] = useState<string>("")

  const cartId = searchParams?.get("cart_id")
  const countryCode = searchParams?.get("country_code")

  useEffect(() => {
    if (!cartId) {
      setStatus("error")
      setErrorMessage("Cart ID fehlt. Bitte versuchen Sie es erneut.")
      return
    }

    const completeCart = async () => {
      try {
        // Complete the cart using the SDK
        const response = await sdk.store.cart.complete(cartId)

        if (response?.type === "order" && response.order?.id) {
          const { order } = response

          // Clear the cart cookie
          document.cookie = "_medusa_cart_id=; max-age=0; path=/"

          setStatus("success")

          // Redirect to confirmation page after brief delay
          setTimeout(() => {
            window.location.href = `/${countryCode || "de"}/order/${order.id}/confirmed`
          }, 800)
        } else if (response?.type === "cart" && response.error) {
          // Cart completion failed
          setStatus("error")
          setErrorMessage(response.error?.message || "Die Zahlung konnte nicht verarbeitet werden.")
        } else {
          setStatus("error")
          setErrorMessage("Unerwartete Antwort vom Server.")
        }
      } catch (error: any) {
        console.error("Error completing cart:", error)
        setStatus("error")
        setErrorMessage(error?.message || "Ein technischer Fehler ist aufgetreten.")
      }
    }

    completeCart()
  }, [cartId, countryCode])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6 max-w-md px-6">
        {status === "processing" && (
          <>
            <div className="w-16 h-16 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-4 border-stone-200 border-t-stone-800 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-6 h-6 text-stone-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl text-stone-800">
                Zahlung wird verarbeitet…
              </h1>
              <p className="text-stone-600">
                Bitte haben Sie einen Moment Geduld, während wir Ihre Zahlung bestätigen und Ihre Bestellung erstellen.
              </p>
            </div>
            <div className="pt-4">
              <div className="h-1 w-48 mx-auto bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full bg-stone-800 animate-pulse w-full" />
              </div>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl text-stone-800">
                Zahlung erfolgreich!
              </h1>
              <p className="text-stone-600">
                Ihre Bestellung wurde aufgegeben. Sie werden gleich zur Bestellbestätigung weitergeleitet…
              </p>
            </div>
          </>
        )}
        
        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl text-stone-800">
                Fehler bei der Verarbeitung
              </h1>
              <p className="text-stone-600">{errorMessage}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <a
                href={`/${countryCode || "de"}/checkout`}
                className="inline-flex items-center justify-center px-6 py-3 border border-stone-300 text-stone-700 font-medium rounded-lg hover:bg-stone-50 transition-colors"
              >
                Zurück zum Checkout
              </a>
              <a
                href={`/${countryCode || "de"}/cart`}
                className="inline-flex items-center justify-center px-6 py-3 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-700 transition-colors"
              >
                Zum Warenkorb
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
