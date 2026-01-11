import { Button } from "@components/ui"
import { useMemo } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { ChevronRight, Truck, RotateCcw, CheckCircle, Package, Clock, ExternalLink } from "@components/icons"
import { cn } from "@lib/utils"
import {
  getFulfillmentStatus,
  SendcloudFulfillmentData,
} from "@lib/util/sendcloud"
import { orderHasReturnableItems } from "@lib/util/returns"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

type FulfillmentWithData = HttpTypes.StoreOrderFulfillment & {
  data?: SendcloudFulfillmentData | null
  labels?: Array<{
    tracking_number?: string
    tracking_url?: string
    label_url?: string
  }>
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])

  const numberOfProducts = useMemo(() => {
    return order.items?.length ?? 0
  }, [order])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-AT", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  // Get fulfillment info - WICHTIG: Gecancelte Fulfillments ausfiltern!
  const fulfillments = (order.fulfillments || []) as FulfillmentWithData[]
  const activeFulfillments = fulfillments.filter(f => !f.canceled_at)
  
  // Nehme das neueste aktive Fulfillment (letztes im Array, da sortiert nach created_at)
  const latestFulfillment = activeFulfillments.length > 0 
    ? activeFulfillments[activeFulfillments.length - 1] 
    : null
  const fulfillmentStatus = latestFulfillment ? getFulfillmentStatus(latestFulfillment) : "pending"
  
  // Get tracking URL from labels or data
  const trackingUrl = latestFulfillment?.labels?.[0]?.tracking_url || 
                     (latestFulfillment?.data as SendcloudFulfillmentData)?.tracking_url
  
  // Check if order can request returns
  const canRequestReturn = orderHasReturnableItems(order)

  // Status badge styles and labels
  const getStatusBadge = () => {
    switch (fulfillmentStatus) {
      case "delivered":
        return {
          icon: <CheckCircle size={14} />,
          label: "Zugestellt",
          className: "bg-green-100 text-green-700"
        }
      case "shipped":
        return {
          icon: <Truck size={14} />,
          label: "Versendet",
          className: "bg-blue-100 text-blue-700"
        }
      case "canceled":
        return {
          icon: <Package size={14} />,
          label: "Storniert",
          className: "bg-red-100 text-red-700"
        }
      default:
        return {
          icon: <Clock size={14} />,
          label: "In Bearbeitung",
          className: "bg-stone-100 text-stone-600"
        }
    }
  }

  const statusBadge = getStatusBadge()

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5" data-testid="order-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-stone-800">
              Bestellung #<span data-testid="order-display-id">{order.display_id}</span>
            </p>
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              statusBadge.className
            )}>
              {statusBadge.icon}
              {statusBadge.label}
            </span>
          </div>
          <p className="text-sm text-stone-500" data-testid="order-created-at">
            {formatDate(order.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-stone-800" data-testid="order-amount">
            {convertToLocale({
              amount: order.total,
              currency_code: order.currency_code,
            })}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            {numberOfLines} {numberOfLines === 1 ? "Artikel" : "Artikel"}
          </p>
        </div>
      </div>

      {/* Items Preview */}
      <div className="grid grid-cols-3 small:grid-cols-4 gap-3 mb-4">
        {order.items?.slice(0, 3).map((i) => {
          return (
            <div
              key={i.id}
              className="flex flex-col gap-y-1.5"
              data-testid="order-item"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-stone-100 p-2 flex items-center justify-center">
                {i.thumbnail ? (
                  <img 
                    src={i.thumbnail} 
                    alt={i.title}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-200 rounded" />
                )}
              </div>
              <div className="text-xs text-stone-600">
                <p className="font-medium truncate" data-testid="item-title">
                  {i.title}
                </p>
                <p className="text-stone-400" data-testid="item-quantity">
                  Menge: {i.quantity}
                </p>
              </div>
            </div>
          )
        })}
        {numberOfProducts > 3 && (
          <div className="aspect-square rounded-lg bg-stone-100 flex flex-col items-center justify-center">
            <span className="text-sm font-medium text-stone-600">
              +{numberOfProducts - 3}
            </span>
            <span className="text-xs text-stone-400">weitere</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-stone-100">
        {/* Tracking Button - Only show when NOT delivered */}
        {trackingUrl && fulfillmentStatus === "shipped" && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Truck size={14} />
            Sendung verfolgen
            <ExternalLink size={12} className="opacity-60" />
          </a>
        )}

        {/* Returns Button - Show when delivered and has returnable items */}
        {canRequestReturn && (fulfillmentStatus === "delivered" || order.fulfillment_status === "delivered") && (
          <LocalizedClientLink
            href={`/account/orders/details/${order.id}/return`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
            Retoure anmelden
          </LocalizedClientLink>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Details Link */}
        <LocalizedClientLink 
          href={`/account/orders/details/${order.id}`}
          className="group"
        >
          <Button 
            data-testid="order-details-link" 
            variant="secondary"
            size="sm"
            className="group"
          >
            Details anzeigen
            <ChevronRight size={16} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard
