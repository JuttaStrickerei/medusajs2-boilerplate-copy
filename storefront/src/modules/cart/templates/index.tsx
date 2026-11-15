import ItemsTemplate from "./items"
import Summary, { getCheckoutStep } from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import { HttpTypes } from "@medusajs/types"
import { cn } from "@lib/utils"
import PageBreadcrumb from "@modules/common/components/page-breadcrumb"
import PageHeader from "@modules/common/components/page-header"
import CheckoutButton from "@modules/checkout/components/checkout-button"
import StickyCheckoutBar from "../components/sticky-checkout-bar"
import { convertToLocale } from "@lib/util/money"
import type { ShippingPreview } from "@lib/data/fulfillment"

const CartTemplate = ({
  cart,
  customer,
  shippingPreview = null,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  shippingPreview?: ShippingPreview | null
}) => {
  const hasItems = cart?.items && cart.items.length > 0
  const itemCount = cart?.items?.length ?? 0
  // Gesamtsumme wie in der Zusammenfassung: mit Versand, auch wenn noch keine Versandart gewählt ist
  const previewAmount =
    !cart?.shipping_methods?.length && shippingPreview ? shippingPreview.amount : 0
  const totalWithShipping = (cart?.total ?? 0) + previewAmount

  return (
    <div className="bg-stone-50 min-h-screen">
      <PageBreadcrumb items={[{ label: "Warenkorb" }]} />
      {/* Kopf nur mit Artikeln; der leere Warenkorb hat eine eigene Überschrift */}
      {hasItems && (
        <PageHeader
          title="Ihr Warenkorb"
          meta={`${itemCount} Artikel in Ihrem Warenkorb`}
        />
      )}

      {/* Main Content */}
      <div
        className={cn(
          "content-container pb-8 small:pb-16",
          !hasItems && "pt-6 small:pt-8"
        )}
        data-testid="cart-container"
      >
        {hasItems ? (
          <div className="grid grid-cols-1 large:grid-cols-[1fr_400px] gap-8 large:gap-12">
            {/* Left Column - Cart Items */}
            <div className="space-y-6">
              {/* Cart Items Card */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <ItemsTemplate cart={cart} />
              </div>

              {/* Konto-Hinweis unter den Artikeln: Erst kommt, was im Warenkorb liegt */}
              {!customer && <SignInPrompt />}
            </div>

            {/* Right Column - Summary */}
            <div className="large:sticky large:top-24 large:self-start">
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
                {cart && cart.region && (
                  <Summary
                    cart={cart as any}
                    isAuthenticated={!!customer}
                    shippingPreview={shippingPreview}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyCartMessage />
        )}
      </div>

      {/* Am Handy liegt die Zusammenfassung weit unten: Summe und „Zur Kasse“ bleiben sichtbar.
          „sticky“ statt „fixed“: Die Leiste endet mit dem Warenkorb und verdeckt die Fußzeile
          (mit „Vertrag widerrufen“) nicht. */}
      {hasItems && cart && (
        <StickyCheckoutBar>
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs text-stone-500 whitespace-nowrap">Gesamt inkl. Versand</p>
              <p className="text-base font-semibold text-stone-800">
                {convertToLocale({
                  amount: totalWithShipping,
                  currency_code: cart.currency_code,
                })}
              </p>
            </div>
            <div className="flex-1">
              <CheckoutButton
                cart={cart}
                step={getCheckoutStep(cart)}
                isAuthenticated={!!customer}
                data-testid="checkout-button-sticky"
              />
            </div>
          </div>
        </StickyCheckoutBar>
      )}
    </div>
  )
}

export default CartTemplate
