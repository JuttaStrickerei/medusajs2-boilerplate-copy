"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import ShippingDetails from "@modules/order/components/shipping-details"
import TrackingSection from "@modules/order/components/tracking-section"
import React from "react"
import { ArrowLeft } from "@components/icons"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  return (
    <div className="p-6 small:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-stone-200">
        <h1 className="font-serif text-2xl font-medium text-stone-800">
          Bestelldetails
        </h1>
        <LocalizedClientLink
          href="/account/orders"
          className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
          data-testid="back-to-overview-button"
        >
          <ArrowLeft size={16} />
          Zurück zur Übersicht
        </LocalizedClientLink>
      </div>
      
      {/* Order Content */}
      <div
        className="space-y-6"
        data-testid="order-details-container"
      >
        <OrderDetails order={order} showStatus />
        <Items order={order} />
        <TrackingSection order={order} />
        <ShippingDetails order={order} />
        <OrderSummary order={order} />
        <Help />
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
