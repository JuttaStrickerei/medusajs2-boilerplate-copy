"use client"

import { clx } from "@medusajs/ui"
import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CheckCircle, Shield, FileText } from "@components/icons"

const Review = ({ cart }: { cart: any }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

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
                  <LocalizedClientLink href="/agb" className="text-stone-800 underline underline-offset-2 hover:text-stone-600">
                    AGB
                  </LocalizedClientLink>
                  ,{" "}
                  <LocalizedClientLink href="/widerrufsrecht" className="text-stone-800 underline underline-offset-2 hover:text-stone-600">
                    Widerrufsbelehrung
                  </LocalizedClientLink>{" "}
                  und{" "}
                  <LocalizedClientLink href="/datenschutz" className="text-stone-800 underline underline-offset-2 hover:text-stone-600">
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
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </div>
      )}
    </div>
  )
}

export default Review
