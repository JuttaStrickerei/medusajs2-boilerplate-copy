import { Container, Heading, Text, Button, Badge } from "@medusajs/ui"
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
      return {
        ...item,
        unfulfilled_quantity: Math.max(0, item.quantity - fulfilledQty),
      }
    })
    .filter((item) => item.unfulfilled_quantity > 0)
}

function getOrderWeight(unfulfilled: (OrderItem & { unfulfilled_quantity: number })[]): number {
  return unfulfilled.reduce((sum, item) => {
    const weight = item.variant?.weight ?? DEFAULT_WEIGHT_GRAMS
    return sum + weight * item.unfulfilled_quantity
  }, 0)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  return [addr.postal_code, addr.city, addr.country_code?.toUpperCase()]
    .filter(Boolean)
    .join(" ")
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
      <div className="rounded-lg border border-ui-border-error bg-ui-bg-field-component p-4">
        <Text className="text-ui-fg-error">{LABELS.openOrders.errorLoad}</Text>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
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
    <div className="flex flex-col gap-y-3 p-4">
      <div className="flex items-center justify-between px-2">
        <Text size="small" className="text-ui-fg-subtle">
          {orders.length} {LABELS.openOrders.title.toLowerCase()} — {LABELS.openOrders.sortNewestFirst}
        </Text>
      </div>

      {orders.map((order) => {
        const unfulfilled = getUnfulfilledItems(order)
        const totalWeight = getOrderWeight(unfulfilled)
        const totalWeightKg = (totalWeight / 1000).toFixed(2)
        const hasDefaultWeights = unfulfilled.some((item) => !item.variant?.weight)
        const isPartial = order.fulfillment_status === "partially_fulfilled"

        return (
          <div
            key={order.id}
            className="rounded-lg border border-ui-border-base bg-ui-bg-base p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-x-2">
                  <Text weight="plus">
                    #{order.display_id}
                  </Text>
                  {isPartial && (
                    <Badge color="orange" size="2xsmall">
                      Teilversand
                    </Badge>
                  )}
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {formatDate(order.created_at)}
                  </Text>
                </div>

                <div className="mt-1 flex items-center gap-x-4">
                  <Text size="small" className="text-ui-fg-subtle">
                    {getRecipientName(order)}
                  </Text>
                  <Text size="small" className="text-ui-fg-muted">
                    → {getDestination(order)}
                  </Text>
                </div>

                <div className="mt-2 flex items-center gap-x-4">
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {unfulfilled.length} {LABELS.openOrders.items}
                  </Text>
                  <div className="flex items-center gap-x-1">
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {totalWeightKg} kg
                    </Text>
                    {hasDefaultWeights && (
                      <Badge color="orange" size="2xsmall">
                        ⚠
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {unfulfilled.slice(0, 4).map((item) => (
                    <Badge key={item.id} color="grey" size="2xsmall">
                      {item.unfulfilled_quantity}× {(item.title || item.product_title || "").substring(0, 30)}
                    </Badge>
                  ))}
                  {unfulfilled.length > 4 && (
                    <Badge color="grey" size="2xsmall">
                      +{unfulfilled.length - 4}
                    </Badge>
                  )}
                </div>
              </div>

              <Button size="small" onClick={() => onFulfill(order.id)}>
                {LABELS.openOrders.fulfillButton}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
