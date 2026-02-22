"use client"

import { clx } from "@medusajs/ui"
import { useState } from "react"
import Spinner from "@modules/common/icons/spinner"
import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CheckCircle, Shield, FileText } from "@components/icons"

const Review = ({ cart }: { cart: any }) => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  // Guard: order placement has started. Show full-page overlay to prevent any
  // interruption, race conditions, or error flashes during the ~5s processing.
  if (isPlacingOrder) {
    return (
      <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="relative">
          {/* Animated outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-stone-200 border-t-stone-800 animate-spin" style={{ width: 80, height: 80 }} />
          {/* Inner checkmark */}
          <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
            <CheckCircle size={40} className="text-stone-800" />
          </div>
        </div>
        <h2 className="font-serif text-2xl mt-8 text-stone-800 text-center">
          Ihre Bestellung wird bearbeitet…
        </h2>
        <p className="text-stone-500 mt-3 text-center max-w-md px-4">
          Bitte haben Sie einen Moment Geduld. Wir bestätigen Ihre Zahlung und erstellen Ihre Bestellung.
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
        <div className={clx(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
          {
            "bg-stone-800 text-white": isOpen,
            "bg-stone-200 text-stone-400": !isOpen,
          }
        )}>
          4
        </div>
        <h3 className={clx(
          "font-serif text-lg font-medium",
          {
            "text-stone-800": isOpen,
            "text-stone-400": !isOpen,
          }
        )}>
          Bestellung abschließen
        </h3>
      </div>

      {isOpen && previousStepsCompleted && (
        <div className="space-y-6">
          {/* Terms Notice */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex items-start gap-3">
              <FileText size={20} className="text-stone-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-stone-600">
                <p>
                  Mit dem Klick auf &quot;Bestellung aufgeben&quot; bestätigen Sie, dass Sie unsere{" "}
                  <LocalizedClientLink href="/terms" className="text-stone-800 underline underline-offset-2 hover:text-stone-600" prefetch={false}>
                    AGB
                  </LocalizedClientLink>
                  ,{" "}
                  <LocalizedClientLink href="/shipping" className="text-stone-800 underline underline-offset-2 hover:text-stone-600" prefetch={false}>
                    Widerrufsbelehrung
                  </LocalizedClientLink>{" "}
                  und{" "}
                  <LocalizedClientLink href="/privacy" className="text-stone-800 underline underline-offset-2 hover:text-stone-600" prefetch={false}>
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
          />
        </div>
      )}
    </div>
  )
}

export default Review
