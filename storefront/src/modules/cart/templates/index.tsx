import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import { HttpTypes } from "@medusajs/types"
import { cn } from "@lib/utils"
import PageBreadcrumb from "@modules/common/components/page-breadcrumb"
import PageHeader from "@modules/common/components/page-header"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const hasItems = cart?.items && cart.items.length > 0
  const itemCount = cart?.items?.length ?? 0

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
          "content-container pb-16",
          !hasItems && "pt-6 small:pt-8"
        )}
        data-testid="cart-container"
      >
        {hasItems ? (
          <div className="grid grid-cols-1 large:grid-cols-[1fr_400px] gap-8 large:gap-12">
            {/* Left Column - Cart Items */}
            <div className="space-y-6">
              {/* Sign In Prompt */}
              {!customer && <SignInPrompt />}

              {/* Cart Items Card */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <ItemsTemplate cart={cart} />
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="large:sticky large:top-24 large:self-start">
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
                {cart && cart.region && (
                  <Summary cart={cart as any} isAuthenticated={!!customer} />
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyCartMessage />
        )}
      </div>
    </div>
  )
}

export default CartTemplate
