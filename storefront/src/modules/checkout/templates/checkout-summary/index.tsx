import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import { Shield, Truck, RefreshCw } from "@components/icons"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  return (
    <div className="space-y-6">
      {/* Order Summary Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50">
          <h2 className="font-serif text-lg font-medium text-stone-800">
            Ihre Bestellung
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            {cart?.items?.length || 0} {cart?.items?.length === 1 ? "Artikel" : "Artikel"}
          </p>
        </div>

        {/* Cart Items Preview */}
        <div className="px-6 py-4 border-b border-stone-200">
          <ItemsPreviewTemplate cart={cart} />
        </div>

        {/* Discount Code */}
        <div className="px-6 py-4 border-b border-stone-200">
          <DiscountCode cart={cart} />
        </div>

        {/* Totals */}
        <div className="px-6 py-4">
          <CartTotals 
            totals={cart} 
            taxIncluded={cart?.region?.automatic_taxes !== false}
          />
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4">
        <div className="flex items-center justify-around text-center">
          <TrustBadgeSmall icon={<Shield size={18} />} text="Sicher" />
          <div className="w-px h-8 bg-stone-200" />
          <TrustBadgeSmall icon={<Truck size={18} />} text="Schnell" />
          <div className="w-px h-8 bg-stone-200" />
          <TrustBadgeSmall icon={<RefreshCw size={18} />} text="30 Tage" />
        </div>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-stone-500">
        <p>Fragen zu Ihrer Bestellung?</p>
        <a href="mailto:office@strickerei-jutta.at" className="text-stone-800 hover:underline">
          office@strickerei-jutta.at
        </a>
      </div>
    </div>
  )
}

function TrustBadgeSmall({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-stone-400">{icon}</span>
      <span className="text-xs text-stone-600">{text}</span>
    </div>
  )
}

export default CheckoutSummary
