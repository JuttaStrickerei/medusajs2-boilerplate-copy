import CartTotals from "@modules/common/components/cart-totals"
import DiscountCode from "@modules/checkout/components/discount-code"
import CheckoutButton from "@modules/checkout/components/checkout-button"
import { HttpTypes } from "@medusajs/types"
import PaymentMethods from "@modules/common/components/payment-methods"
import DeliveryLine from "@modules/common/components/delivery-line"
import type { ShippingPreview } from "@lib/data/fulfillment"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
  isAuthenticated?: boolean
  shippingPreview?: ShippingPreview | null
}

export function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart, isAuthenticated = false, shippingPreview = null }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="space-y-5">
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
        shippingPreview={shippingPreview}
      />

      {/* Checkout Button */}
      <div id="cart-summary-checkout">
        <CheckoutButton
          cart={cart}
          step={step}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Liefertermin und Zahlungsarten schon hier, nicht erst im dritten Kassenschritt */}
      <div className="space-y-2.5">
        <DeliveryLine className="text-xs text-stone-500 text-center [text-wrap:balance]" />
        <PaymentMethods label="" large className="justify-center" />
      </div>
    </div>
  )
}

export default Summary
