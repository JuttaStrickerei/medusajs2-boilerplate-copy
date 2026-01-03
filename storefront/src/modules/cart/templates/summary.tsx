"use client"

import CartTotals from "@modules/common/components/cart-totals"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@components/ui"
import { ArrowRight } from "@components/icons"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif text-xl font-medium text-stone-800">
          Zusammenfassung
        </h2>
      </div>

      {/* Discount Code */}
      <div>
        <DiscountCode cart={cart} />
      </div>

      {/* Divider */}
      <div className="border-t border-stone-200" />

      {/* Totals */}
      <CartTotals 
        totals={cart} 
        taxIncluded={cart.region?.automatic_taxes !== false}
      />

      {/* Checkout Button */}
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
        className="block"
      >
        <Button className="w-full h-12 text-base">
          Zur Kasse
          <ArrowRight size={18} className="ml-2" />
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
