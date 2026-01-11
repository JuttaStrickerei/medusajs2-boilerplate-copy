import CartTotals from "@modules/common/components/cart-totals"
import DiscountCode from "@modules/checkout/components/discount-code"
import CheckoutButton from "@modules/checkout/components/checkout-button"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
  isAuthenticated?: boolean
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

const Summary = ({ cart, isAuthenticated = false }: SummaryProps) => {
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
      <CheckoutButton 
        cart={cart}
        step={step}
        isAuthenticated={isAuthenticated}
      />
    </div>
  )
}

export default Summary
