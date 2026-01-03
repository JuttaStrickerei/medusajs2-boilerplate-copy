import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ShoppingBag } from "@components/icons"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="content-container py-8 small:py-12">
          <div className="text-center max-w-xl mx-auto">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-stone-100 mb-4">
              <ShoppingBag size={24} className="text-stone-600" />
            </div>
            <h1 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-2">
              Ihr Warenkorb
            </h1>
            {cart?.items?.length ? (
              <p className="text-stone-600">
                {cart.items.length} {cart.items.length === 1 ? "Artikel" : "Artikel"} in Ihrem Warenkorb
              </p>
            ) : (
              <p className="text-stone-600">Ihr Warenkorb ist leer</p>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="content-container py-4">
        <nav className="flex items-center gap-2 text-sm text-stone-500">
          <LocalizedClientLink href="/" className="hover:text-stone-800 transition-colors">
            Home
          </LocalizedClientLink>
          <span>/</span>
          <span className="text-stone-800">Warenkorb</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="content-container pb-16" data-testid="cart-container">
        {cart?.items?.length ? (
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
                {cart && cart.region && <Summary cart={cart as any} />}
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
