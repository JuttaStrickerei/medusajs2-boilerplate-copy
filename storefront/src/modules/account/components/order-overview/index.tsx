"use client"

import { Button } from "@components/ui"
import { Package } from "@components/icons"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-6 w-full">
        {orders.map((o) => (
          <div
            key={o.id}
            className="border-b border-stone-200 pb-6 last:pb-0 last:border-none"
          >
            <OrderCard order={o} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4 py-12"
      data-testid="no-orders-container"
    >
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-2">
        <Package size={28} className="text-stone-400" />
      </div>
      <h2 className="font-serif text-xl font-medium text-stone-800">
        Noch keine Bestellungen
      </h2>
      <p className="text-sm text-stone-500 text-center max-w-xs">
        Sie haben noch keine Bestellungen aufgegeben. Entdecken Sie unsere Kollektionen!
      </p>
      <div className="mt-4">
        <LocalizedClientLink href="/store" passHref>
          <Button data-testid="continue-shopping-button">
            Jetzt einkaufen
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview
