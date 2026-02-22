"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "@lib/config"

const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000 // 1 second

/**
 * @name CompletePaymentPage
 * @description Loading page for completing off-site payments (PayPal, 3D Secure, Klarna).
 * Shows a graceful loading state while the cart is being completed.
 * Implements retry logic with exponential backoff to handle race conditions
 * between Stripe webhooks and frontend completion.
 */
export default function CompletePaymentPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [attemptCount, setAttemptCount] = useState<number>(0)

  const cartId = searchParams?.get("cart_id")
  const countryCode = searchParams?.get("country_code")

  useEffect(() => {
    if (!cartId) {
      setStatus("error")
      setErrorMessage("Cart ID fehlt. Bitte versuchen Sie es erneut.")
      return
    }

    /**
     * Attempt to find order by cart ID as fallback
     * This handles the case where webhook succeeded but frontend missed the response
     */
    const findOrderByCartId = async (): Promise<HttpTypes.StoreOrder | null> => {
      try {
        // Query orders API to find order by cart_id
        // Using the SDK to list orders with cart_id filter
        const response = await sdk.client.fetch<{ orders: HttpTypes.StoreOrder[] }>(
          `/store/orders?cart_id=${cartId}`,
          {
            method: "GET",
          }
        )

        if (response?.orders && response.orders.length > 0) {
          return response.orders[0]
        }
        return null
      } catch (error) {
        console.error("Error finding order by cart ID:", error)
        return null
      }
    }

    /**
     * Complete cart with exponential backoff retry logic
     * Handles race condition where webhook completes cart before frontend
     */
    const completeCartWithRetry = async (attempt = 1): Promise<void> => {
      setAttemptCount(attempt)

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
          // Cart completion failed - check if we should retry
          const errorMsg = response.error?.message || ""
          const isRetryableError =
            errorMsg.toLowerCase().includes("lock") ||
            errorMsg.toLowerCase().includes("concurrent") ||
            errorMsg.toLowerCase().includes("processing") ||
            errorMsg.toLowerCase().includes("pending")

          if (isRetryableError && attempt < MAX_RETRIES) {
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1)
            console.log(`Retrying cart completion (attempt ${attempt}/${MAX_RETRIES}) after ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            return completeCartWithRetry(attempt + 1)
          }

          // Non-retryable error or max retries reached
          setStatus("error")
          setErrorMessage(response.error?.message || "Die Zahlung konnte nicht verarbeitet werden.")
        } else {
          // Unexpected response format
          setStatus("error")
          setErrorMessage("Unerwartete Antwort vom Server.")
        }
      } catch (error: any) {
        console.error(`Error completing cart (attempt ${attempt}):`, error)

        const errorMsg = error?.message || ""
        const isRetryableError =
          errorMsg.toLowerCase().includes("lock") ||
          errorMsg.toLowerCase().includes("concurrent") ||
          errorMsg.toLowerCase().includes("processing") ||
          errorMsg.toLowerCase().includes("pending") ||
          errorMsg.toLowerCase().includes("timeout") ||
          errorMsg.toLowerCase().includes("network")

        if (isRetryableError && attempt < MAX_RETRIES) {
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1)
          console.log(`Retrying cart completion (attempt ${attempt}/${MAX_RETRIES}) after ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          return completeCartWithRetry(attempt + 1)
        }

        // Max retries reached or non-retryable error - try fallback
        console.log("Max retries reached or non-retryable error. Trying order lookup fallback...")
        const existingOrder = await findOrderByCartId()

        if (existingOrder?.id) {
          // Order was already created by webhook! Proceed to success
          console.log("Found existing order via fallback:", existingOrder.id)
          document.cookie = "_medusa_cart_id=; max-age=0; path=/"
          setStatus("success")
          setTimeout(() => {
            window.location.href = `/${countryCode || "de"}/order/${existingOrder.id}/confirmed`
          }, 800)
          return
        }

        // No order found - show error
        setStatus("error")
        setErrorMessage(error?.message || "Ein technischer Fehler ist aufgetreten.")
      }
    }

    completeCartWithRetry()
  }, [cartId, countryCode])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6 max-w-md px-6">
        {status === "processing" && (
          <>
            <div className="w-16 h-16 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-4 border-stone-200 border-t-stone-800 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-stone-800"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl text-stone-800">Zahlung wird verarbeitet...</h1>
              <p className="text-stone-600">
                Bitte haben Sie einen Moment Geduld, während wir Ihre Zahlung bestätigen und Ihre
                Bestellung erstellen.
              </p>
              {attemptCount > 1 && (
                <p className="text-sm text-stone-500 animate-pulse">
                  Versuch {attemptCount} von {MAX_RETRIES}...
                </p>
              )}
            </div>
            <div className="pt-4">
              <div className="h-1 w-48 mx-auto bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-800 transition-all duration-1000"
                  style={{
                    width: `${Math.min((attemptCount / MAX_RETRIES) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl text-stone-800">Zahlung erfolgreich!</h1>
              <p className="text-stone-600">
                Ihre Bestellung wurde aufgegeben. Sie werden gleich zur Bestellbestätigung
                weitergeleitet...
              </p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl text-stone-800">Fehler bei der Verarbeitung</h1>
              <p className="text-stone-600">{errorMessage}</p>
              {attemptCount > 1 && (
                <p className="text-xs text-stone-400">
                  Nach {attemptCount} Versuchen konnte die Bestellung nicht abgeschlossen werden.
                </p>
              )}
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
