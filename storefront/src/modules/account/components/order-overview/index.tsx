"use client"

import { Button } from "@medusajs/ui"
import { useTranslations } from "next-intl" // <--- DIESEN IMPORT HINZUFÜGEN

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  const t = useTranslations('orders') // <--- DIESE ZEILE HINZUFÜGEN

  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-8 w-full">
        {orders.map((o) => (
          <div
            key={o.id}
            className="border-b border-gray-200 pb-6 last:pb-0 last:border-none"
          >
            <OrderCard order={o} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4"
      data-testid="no-orders-container"
    >
      <h2 className="text-large-semi">{t("no_orders_title")}</h2> {/* <--- ÜBERSETZT */}
      <p className="text-base-regular">
        {t("no_orders_description")} {/* <--- ÜBERSETZT */}
      </p>
      <div className="mt-4">
        <LocalizedClientLink href="/" passHref>
          <Button data-testid="continue-shopping-button">
            {t("continue_shopping_button")} {/* <--- ÜBERSETZT */}
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview