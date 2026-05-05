import { Text, Button, Badge, toast, usePrompt } from "@medusajs/ui"
import { useMutation } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { sdk } from "../../../lib/sdk"
import { LABELS } from "./dashboard-labels"
import { PickupDetailDrawer } from "./pickup-detail-drawer"
import type { OpenOrder, OrderItem, OrderFulfillment } from "./types"

type PickupOrdersSectionProps = {
  orders: OpenOrder[]
  isLoading: boolean
  isError: boolean
  onRefresh: () => void
}

function getUnfulfilledItems(
  order: OpenOrder
): (OrderItem & { unfulfilled_quantity: number })[] {
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

function getActiveFulfillment(order: OpenOrder): OrderFulfillment | null {
  const active = (order.fulfillments || [])
    .filter((f) => !f.canceled_at && !f.delivered_at)
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    )
  return active[0] || null
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

export function PickupOrdersSection({
  orders,
  isLoading,
  isError,
  onRefresh,
}: PickupOrdersSectionProps) {
  const dialog = usePrompt()
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const markReadyMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const order = orders.find((o) => o.id === orderId)
      if (!order) throw new Error("Order not found in current list")

      const items = getUnfulfilledItems(order).map((i) => ({
        id: i.id,
        quantity: i.unfulfilled_quantity,
      }))
      if (items.length === 0) {
        throw new Error(LABELS.pickup.noItemsToPrepare)
      }
      await sdk.client.fetch(`/admin/orders/${orderId}/fulfillments`, {
        method: "POST",
        body: { items },
      })
    },
    onSuccess: () => {
      toast.success(LABELS.pickup.toastReadySuccess)
      setSelectedOrderId(null)
      onRefresh()
    },
    onError: (error: any) => {
      toast.error(
        error?.message ||
          error?.body?.message ||
          LABELS.pickup.toastReadyError
      )
    },
  })

  const markPickedUpMutation = useMutation({
    mutationFn: async ({
      orderId,
      fulfillmentId,
    }: {
      orderId: string
      fulfillmentId: string
    }) => {
      await sdk.client.fetch(
        `/admin/orders/${orderId}/fulfillments/${fulfillmentId}/mark-as-delivered`,
        { method: "POST" }
      )
    },
    onSuccess: () => {
      toast.success(LABELS.pickup.toastPickedUpSuccess)
      setSelectedOrderId(null)
      onRefresh()
    },
    onError: (error: any) => {
      toast.error(
        error?.message ||
          error?.body?.message ||
          LABELS.pickup.toastPickedUpError
      )
    },
  })

  const handleMarkPickedUp = useCallback(
    async (orderId: string, fulfillmentId: string) => {
      const confirmed = await dialog({
        title: LABELS.pickup.confirmPickupTitle,
        description: LABELS.pickup.confirmPickupBody,
        confirmText: LABELS.pickup.confirmPickupConfirm,
        cancelText: LABELS.pickup.confirmPickupCancel,
        variant: "confirmation",
      })
      if (!confirmed) return
      markPickedUpMutation.mutate({ orderId, fulfillmentId })
    },
    [dialog, markPickedUpMutation]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Text className="text-ui-fg-subtle">{LABELS.pickup.loading}</Text>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-ui-border-error bg-ui-bg-field-component m-4 p-4">
        <Text className="text-ui-fg-error">{LABELS.pickup.errorLoad}</Text>
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
          {LABELS.pickup.emptyTitle}
        </Text>
        <Text size="small" className="text-ui-fg-muted mt-1">
          {LABELS.pickup.emptyDescription}
        </Text>
      </div>
    )
  }

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null
  const isSelectedPending =
    !!selectedOrderId &&
    ((markReadyMutation.isPending &&
      markReadyMutation.variables === selectedOrderId) ||
      (markPickedUpMutation.isPending &&
        markPickedUpMutation.variables?.orderId === selectedOrderId))

  return (
    <>
      <div className="flex flex-col gap-y-0 divide-y divide-ui-border-base">
        <div className="flex items-center justify-between px-6 py-2">
          <Text size="small" className="text-ui-fg-muted">
            {orders.length} {LABELS.pickup.title.toLowerCase()}
          </Text>
        </div>

        {orders.map((order) => {
          const activeFf = getActiveFulfillment(order)
          const unfulfilled = getUnfulfilledItems(order)
          const isReady = !!activeFf
          // Item count summary — full list lives in the detail drawer now,
          // so the row stays scannable even for 10+ item orders.
          const itemsToRender = isReady && activeFf
            ? activeFf.items
            : unfulfilled.map((i) => ({ quantity: i.unfulfilled_quantity }))
          const totalUnits = itemsToRender.reduce(
            (acc, i) => acc + i.quantity,
            0
          )
          const itemCountLabel = `${totalUnits} ${
            totalUnits === 1
              ? LABELS.pickup.itemsCountSingular
              : LABELS.pickup.itemsCountPlural
          }`

          return (
            <div
              key={order.id}
              className="flex items-center gap-x-4 px-6 py-3 hover:bg-ui-bg-subtle/50 transition-colors"
            >
              {/* Order number + date */}
              <div className="w-24 shrink-0">
                <Text size="small" weight="plus">
                  #{order.display_id}
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  {formatDate(order.created_at)}
                </Text>
              </div>

              {/* Recipient */}
              <div className="w-44 shrink-0">
                <Text size="small" weight="plus" className="truncate">
                  {getRecipientName(order)}
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted truncate">
                  {order.email}
                </Text>
              </div>

              {/* Item summary (count only — details in drawer) */}
              <div className="flex-1 min-w-0">
                <Text size="small" className="text-ui-fg-subtle">
                  {itemCountLabel}
                </Text>
              </div>

              {/* Status */}
              <div className="shrink-0">
                {isReady ? (
                  <Badge color="green" size="2xsmall">
                    {LABELS.pickup.statusReady}
                  </Badge>
                ) : (
                  <Badge color="orange" size="2xsmall">
                    {LABELS.pickup.statusReceived}
                  </Badge>
                )}
              </div>

              {/* Action — single Details button, real actions live in the drawer */}
              <Button
                variant="secondary"
                size="small"
                onClick={() => setSelectedOrderId(order.id)}
                className="shrink-0"
              >
                {LABELS.pickup.detailsButton}
              </Button>
            </div>
          )
        })}
      </div>

      <PickupDetailDrawer
        order={selectedOrder}
        open={!!selectedOrderId}
        onOpenChange={(open) => {
          if (!open) setSelectedOrderId(null)
        }}
        isPending={isSelectedPending}
        onMarkReady={(orderId) => markReadyMutation.mutate(orderId)}
        onMarkPickedUp={handleMarkPickedUp}
      />
    </>
  )
}
