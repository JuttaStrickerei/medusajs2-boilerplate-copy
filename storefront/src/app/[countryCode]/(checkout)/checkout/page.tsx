import { getCartId } from "@lib/data/cookies"
import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getShippingPreview } from "@lib/data/fulfillment"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutErrorBoundary from "@modules/checkout/components/checkout-error-boundary"
import CartPending from "@modules/checkout/components/checkout-notice/cart-pending"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import { BeginCheckout } from "@modules/common/components/analytics"
import { gaCurrency, lineItemToItem } from "@lib/util/analytics"
import { convertToLocale } from "@lib/util/money"
import { cartSignature } from "@lib/util/cart-signature"
import CartFreshness from "@modules/cart/components/cart-freshness"

export const metadata: Metadata = {
  title: "Kasse",
  description: "Sicher und einfach bestellen",
  robots: { index: false, follow: false },
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
        <CartPending />
      </div>
    )
  }

  const customer = await retrieveCustomer()
  // Allow guest checkout - no redirect needed

  // Versandkosten schon im ersten Schritt zeigen, nicht erst nach der Wahl der Versandart
  const shippingPreview = !cart.shipping_methods?.length
    ? await getShippingPreview(cart.id)
    : null

  return (
    <div className="content-container py-8 small:py-12">
      {/* gleicht die Kasse mit dem echten Warenkorb ab (z. B. nach einem Gutschein):
          Betrag und Zahlungsfeld müssen denselben Stand haben */}
      <CartFreshness signature={cartSignature(cart)} />
      {/* Page Header */}
      <div className="text-center mb-6 small:mb-12">
        <h1 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-2">
          Kasse
        </h1>
        <p className="text-sm small:text-base text-stone-600">
          Sicher bezahlen, SSL-verschlüsselt
        </p>
      </div>

      {/* Am Handy steht die Bestellübersicht unter dem Formular: Die Summe schon hier zeigen */}
      <a
        href="#bestellung"
        className="large:hidden flex items-center justify-between gap-4 mb-4 px-5 py-3 bg-white rounded-2xl border border-stone-200 text-sm text-stone-600"
        data-testid="checkout-total-strip"
      >
        <span className="underline underline-offset-4">Ihre Bestellung ansehen</span>
        <span className="text-base font-semibold text-stone-800 whitespace-nowrap">
          {convertToLocale({
            amount: (cart.total ?? 0) + (shippingPreview?.amount ?? 0),
            currency_code: cart.currency_code,
          })}
        </span>
      </a>

      {/* Main Content */}
      <div className="grid grid-cols-1 large:grid-cols-[1fr_420px] gap-8 large:gap-12">
        {/* Left Column - Checkout Form */}
        <div>
          <BeginCheckout
            cartId={cart.id}
            currency={gaCurrency(cart.currency_code)}
            value={cart.total ?? 0}
            items={(cart.items ?? []).map(lineItemToItem)}
          />
          <PaymentWrapper cart={cart}>
            {/* fängt Render-Fehler im Formular ab: Hinweis mit Weg weiter statt kaputter Seite */}
            <CheckoutErrorBoundary>
              <CheckoutForm cart={cart} customer={customer} />
            </CheckoutErrorBoundary>
          </PaymentWrapper>
        </div>
        
        {/* Right Column - Order Summary */}
        <div id="bestellung" className="scroll-mt-20 large:sticky large:top-24 large:self-start">
          <CheckoutSummary cart={cart} shippingPreview={shippingPreview} />
        </div>
      </div>
    </div>
  )
}
