import { Text, Button, Badge } from "@medusajs/ui"
import { LABELS } from "./dashboard-labels"
import type { OpenOrder, OrderItem } from "./types"

type OpenOrdersSectionProps = {
  orders: OpenOrder[]
  isLoading: boolean
  isError: boolean
  onFulfill: (orderId: string) => void
}

const DEFAULT_WEIGHT_GRAMS = 500

function getUnfulfilledItems(order: OpenOrder): (OrderItem & { unfulfilled_quantity: number })[] {
  return order.items
    .map((item) => {
      let fulfilledQty = 0
      for (const ff of order.fulfillments || []) {
        if (ff.canceled_at) continue
        for (const fi of ff.items || []) {
          if (fi.line_item_id === item.id) {
            fulfilledQty += fi.quantity
          }
        }
      }
      return { ...item, unfulfilled_quantity: Math.max(0, item.quantity - fulfilledQty) }
    })
    .filter((item) => item.unfulfilled_quantity > 0)
}

function getOrderWeight(unfulfilled: (OrderItem & { unfulfilled_quantity: number })[]): number {
  return unfulfilled.reduce((sum, item) => {
    return sum + (item.variant?.weight ?? DEFAULT_WEIGHT_GRAMS) * item.unfulfilled_quantity
  }, 0)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function getRecipientName(order: OpenOrder): string {
  const addr = order.shipping_address
  if (!addr) return order.email || "—"
  const parts = [addr.first_name, addr.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : addr.company || order.email || "—"
}

function getDestination(order: OpenOrder): string {
  const addr = order.shipping_address
  if (!addr) return "—"
  return [addr.postal_code, addr.city].filter(Boolean).join(" ")
}

function getCountry(order: OpenOrder): string {
  return order.shipping_address?.country_code?.toUpperCase() || ""
}

function getItemThumbnail(item: OrderItem): string | null {
  return item.thumbnail || item.variant?.product?.thumbnail || null
}

export function OpenOrdersSection({ orders, isLoading, isError, onFulfill }: OpenOrdersSectionProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Text className="text-ui-fg-subtle">{LABELS.openOrders.loading}</Text>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-ui-border-error bg-ui-bg-field-component m-4 p-4">
        <Text className="text-ui-fg-error">{LABELS.openOrders.errorLoad}</Text>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ui-bg-subtle mb-3">
          <Text className="text-2xl">✓</Text>
        </div>
        <Text size="large" weight="plus" className="text-ui-fg-subtle">
          {LABELS.openOrders.emptyTitle}
        </Text>
        <Text size="small" className="text-ui-fg-muted mt-1">
          {LABELS.openOrders.emptyDescription}
        </Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-0 divide-y divide-ui-border-base">
      <div className="flex items-center justify-between px-6 py-2">
        <Text size="small" className="text-ui-fg-muted">
          {orders.length} {LABELS.openOrders.title.toLowerCase()}
        </Text>
      </div>

      {orders.map((order) => {
        const unfulfilled = getUnfulfilledItems(order)
        const totalWeight = getOrderWeight(unfulfilled)
        const totalWeightKg = (totalWeight / 1000).toFixed(2)
        const isPartial = order.fulfillment_status === "partially_fulfilled"
        const country = getCountry(order)

        return (
          <div
            key={order.id}
            className="flex items-center gap-x-4 px-6 py-3 hover:bg-ui-bg-subtle/50 transition-colors"
          >
            {/* Order number + date */}
            <div className="w-24 shrink-0">
              <Text size="small" weight="plus">#{order.display_id}</Text>
              <Text size="xsmall" className="text-ui-fg-muted">{formatDate(order.created_at)}</Text>
            </div>

            {/* Recipient + destination */}
            <div className="w-44 shrink-0">
              <Text size="small" weight="plus" className="truncate">{getRecipientName(order)}</Text>
              <Text size="xsmall" className="text-ui-fg-muted truncate">
                {getDestination(order)} {country && <span className="uppercase">{country}</span>}
              </Text>
            </div>

            {/* Items list */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-x-2">
                {unfulfilled.slice(0, 3).map((item) => {
                  const thumb = getItemThumbnail(item)
                  return (
                    <div key={item.id} className="flex items-center gap-x-1.5 max-w-[180px]">
                      {thumb ? (
                        <img src={thumb} alt="" className="h-6 w-6 rounded object-cover shrink-0" />
                      ) : (
                        <div className="h-6 w-6 rounded bg-ui-bg-subtle shrink-0" />
                      )}
                      <Text size="xsmall" className="truncate text-ui-fg-subtle">
                        {item.unfulfilled_quantity}× {(item.title || item.product_title || "").substring(0, 25)}
                      </Text>
                    </div>
                  )
                })}
                {unfulfilled.length > 3 && (
                  <Text size="xsmall" className="text-ui-fg-muted shrink-0">
                    +{unfulfilled.length - 3}
                  </Text>
                )}
              </div>
            </div>

            {/* Weight + badges */}
            <div className="flex items-center gap-x-2 shrink-0">
              <Text size="xsmall" className="text-ui-fg-muted">{totalWeightKg} kg</Text>
              {isPartial && <Badge color="orange" size="2xsmall">Teil</Badge>}
            </div>

            {/* Action */}
            <Button size="small" onClick={() => onFulfill(order.id)} className="shrink-0">
              {LABELS.openOrders.fulfillButton}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
