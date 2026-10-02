"use client"

import { Button, clx } from "@medusajs/ui"
import { useState } from "react"
import Spinner from "@modules/common/icons/spinner"
import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CheckCircle, Shield, FileText } from "@components/icons"
import { placeOrder } from "@lib/data/cart"
import { isRedirectError } from "next/dist/client/components/redirect-error"

const Review = ({ cart }: { cart: any }) => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderFailed, setOrderFailed] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryFailed, setRetryFailed] = useState(false)
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  // Completing the cart again is safe: Medusa only re-reads the Stripe payment
  // (no second charge) and returns the existing order if one was created.
  const retryPlaceOrder = async () => {
    setIsRetrying(true)
    setRetryFailed(false)
    try {
      const result = await placeOrder()
      if (result?.error) {
        console.error("Order retry failed:", result.error)
        setRetryFailed(true)
        setIsRetrying(false)
      }
    } catch (err: unknown) {
      // NEXT_REDIRECT: keep loading until redirect completes
      if (isRedirectError(err)) {
        return
      }
      console.error("Order retry failed:", err)
      setRetryFailed(true)
      setIsRetrying(false)
    }
  }

  // The payment step finished, but the order could not be created. Keep this
  // on screen (instead of the payment button) until the retry succeeds.
  if (orderFailed) {
    return (
      <div
        className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center px-4 animate-in fade-in duration-300"
        role="alert"
        data-testid="order-failed-after-payment"
      >
        <h2 className="font-serif text-2xl text-stone-800 text-center">
          Ihre Bestellung konnte noch nicht abgeschlossen werden
        </h2>
        <p className="text-stone-600 mt-3 text-center max-w-md">
          Bitte versuchen Sie es erneut. Eine bereits erfolgte Zahlung wird
          dabei nicht noch einmal abgebucht.
        </p>
        <Button
          size="large"
          className="mt-8"
          isLoading={isRetrying}
          onClick={retryPlaceOrder}
          data-testid="retry-place-order-button"
        >
          Erneut versuchen
        </Button>
        {retryFailed && (
          <p className="text-rose-500 text-sm mt-4 text-center max-w-md">
            Das hat leider noch nicht geklappt.
          </p>
        )}
        <p className="text-sm text-stone-500 mt-6 text-center max-w-md">
          Bleibt das Problem bestehen, schreiben Sie uns bitte an{" "}
          <a
            href="mailto:office@strickerei-jutta.at"
            className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
          >
            office@strickerei-jutta.at
          </a>
          . Wir kümmern uns persönlich darum.
        </p>
      </div>
    )
  }

  // Guard: order placement has started. Show full-page overlay to prevent any
  // interruption, race conditions, or error flashes during the ~5s processing.
  if (isPlacingOrder) {
    return (
      <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="relative">
          {/* Animated outer ring */}
          <div
            className="absolute inset-0 rounded-full border-4 border-stone-200 border-t-stone-800 animate-spin"
            style={{ width: 80, height: 80 }}
          />
          {/* Inner checkmark */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: 80, height: 80 }}
          >
            <CheckCircle size={40} className="text-stone-800" />
          </div>
        </div>
        <h2 className="font-serif text-2xl mt-8 text-stone-800 text-center">
          Ihre Bestellung wird bearbeitet…
        </h2>
        <p className="text-stone-500 mt-3 text-center max-w-md px-4">
          Bitte haben Sie einen Moment Geduld. Wir bestätigen Ihre Zahlung und
          erstellen Ihre Bestellung.
        </p>
        <div className="mt-8 flex items-center gap-2 text-sm text-stone-400">
          <Spinner size={16} />
          <span>Verbindung sichern…</span>
        </div>
      </div>
    )
  }

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    cart.shipping_methods.length > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className={clx(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            {
              "bg-stone-800 text-white": isOpen,
              "bg-stone-200 text-stone-400": !isOpen,
            }
          )}
        >
          4
        </div>
        <h3
          className={clx("font-serif text-lg font-medium", {
            "text-stone-800": isOpen,
            "text-stone-400": !isOpen,
          })}
        >
          Bestellung abschließen
        </h3>
      </div>

      {isOpen && previousStepsCompleted && (
        <div className="space-y-6">
          {/* Terms Notice */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex items-start gap-3">
              <FileText
                size={20}
                className="text-stone-400 flex-shrink-0 mt-0.5"
              />
              <div className="text-sm text-stone-600">
                <p>
                  Mit dem Klick auf &quot;Bestellung aufgeben&quot; bestätigen
                  Sie, dass Sie unsere{" "}
                  <LocalizedClientLink
                    href="/terms"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                    prefetch={false}
                  >
                    AGB
                  </LocalizedClientLink>
                  ,{" "}
                  <LocalizedClientLink
                    href="/terms#widerrufsrecht"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                    prefetch={false}
                  >
                    Widerrufsbelehrung
                  </LocalizedClientLink>{" "}
                  und{" "}
                  <LocalizedClientLink
                    href="/privacy"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                    prefetch={false}
                  >
                    Datenschutzerklärung
                  </LocalizedClientLink>{" "}
                  gelesen und akzeptiert haben.
                </p>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
            <Shield size={16} />
            <span>Sichere SSL-verschlüsselte Übertragung</span>
          </div>

          {/* Payment Button */}
          <PaymentButton
            cart={cart}
            data-testid="submit-order-button"
            onPlacingOrder={() => setIsPlacingOrder(true)}
            onPaymentError={() => setIsPlacingOrder(false)}
            onOrderFailed={() => {
              setOrderFailed(true)
              setIsPlacingOrder(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

export default Review
