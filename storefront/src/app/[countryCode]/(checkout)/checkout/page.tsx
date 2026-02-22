import { getCartId } from "@lib/data/cookies"
import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout | Strickerei Jutta",
  description: "Sicher und einfach bestellen",
}

export default async function Checkout({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ step?: string }>
}) {
  const { countryCode } = await params
  const cartId = await getCartId()
  const cart = await retrieveCart()

  // Cart exists but is empty → always redirect to cart (normal empty-cart case)
  if (cart && (!cart.items || cart.items.length === 0)) {
    redirect(`/${countryCode}/cart`)
  }

  // Cart fetch returned null
  if (!cart) {
    // No cookie either → user navigated to checkout with no cart at all
    if (!cartId) {
      redirect(`/${countryCode}/cart`)
    }
    // Cookie existed but cart is gone → race condition after order placement.
    // The placeOrder redirect will arrive momentarily; show a neutral holding state
    // instead of throwing a 500 or flashing a redirect to /cart.
    return (
      <div className="content-container py-8 small:py-12 flex items-center justify-center min-h-[200px]">
        <p className="text-stone-600">Weiterleitung zur Bestellbestätigung…</p>
      </div>
    )
  }

  const customer = await retrieveCustomer()
  // Allow guest checkout - no redirect needed

  return (
    <div className="content-container py-8 small:py-12">
      {/* Page Header */}
      <div className="text-center mb-8 small:mb-12">
        <h1 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-2">
          Checkout
        </h1>
        <p className="text-stone-600">
          Sichere Bezahlung mit SSL-Verschlüsselung
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 large:grid-cols-[1fr_420px] gap-8 large:gap-12">
        {/* Left Column - Checkout Form */}
        <div>
          <PaymentWrapper cart={cart}>
            <CheckoutForm cart={cart} customer={customer} />
          </PaymentWrapper>
        </div>
        
        {/* Right Column - Order Summary */}
        <div className="large:sticky large:top-24 large:self-start">
          <CheckoutSummary cart={cart} />
        </div>
      </div>
    </div>
  )
}
