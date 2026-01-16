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
  const cart = await retrieveCart()

  // Redirect to cart if no cart exists or cart is empty
  if (!cart || !cart.items || cart.items.length === 0) {
    redirect(`/${countryCode}/cart`)
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
