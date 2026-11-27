import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import CheckoutNotice from "@modules/checkout/components/checkout-notice"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  // Versand- oder Zahlungsarten nicht ladbar (Backend kurz weg): Hinweis statt leerer Kasse
  if (!shippingMethods || !paymentMethods) {
    return (
      <CheckoutNotice
        title="Die Kasse konnte gerade nicht vollständig geladen werden."
        reload
        data-testid="checkout-load-error"
      >
        <p>
          Ihr Warenkorb ist gespeichert. Bitte laden Sie die Seite in einem
          Moment neu.
        </p>
      </CheckoutNotice>
    )
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Address */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <Addresses cart={cart} customer={customer} />
      </div>

      {/* Step 2: Shipping */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <Shipping cart={cart} availableShippingMethods={shippingMethods} />
      </div>

      {/* Step 3: Payment */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <Payment cart={cart} availablePaymentMethods={paymentMethods} />
      </div>

      {/* Step 4: Review & Place Order */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <Review cart={cart} />
      </div>
    </div>
  )
}
