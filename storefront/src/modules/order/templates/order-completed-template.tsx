import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"
import { CheckCircle } from "@components/icons"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  return (
    <div className="py-12 min-h-[calc(100vh-64px)] bg-stone-50">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="flex flex-col gap-6 max-w-4xl h-full bg-white w-full p-8 rounded-2xl border border-stone-200 shadow-sm"
          data-testid="order-complete-container"
        >
          {/* Success Header */}
          <div className="text-center pb-6 border-b border-stone-200">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="font-serif text-3xl font-medium text-stone-800 mb-2">
              Vielen Dank!
            </h1>
            <p className="text-stone-600">
              Ihre Bestellung wurde erfolgreich aufgegeben.
            </p>
          </div>
          
          <OrderDetails order={order} />
          
          <div className="pt-6 border-t border-stone-200">
            <h2 className="font-serif text-xl font-medium text-stone-800 mb-4">
              Bestellübersicht
            </h2>
            <Items order={order} />
          </div>
          
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}
