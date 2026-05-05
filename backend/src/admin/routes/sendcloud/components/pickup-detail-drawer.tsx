import { Drawer, Button, Badge, Text, Heading } from "@medusajs/ui"
import { LABELS } from "./dashboard-labels"
import type { OpenOrder, OrderItem, OrderFulfillment } from "./types"

type PickupDetailDrawerProps = {
  order: OpenOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onMarkReady: (orderId: string) => void
  onMarkPickedUp: (orderId: string, fulfillmentId: string) => void
}

type RenderableItem = OrderItem & { unfulfilled_quantity: number }

function getUnfulfilledItems(order: OpenOrder): RenderableItem[] {
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

function getItemThumbnail(item: OrderItem): string | null {
  return item.thumbnail || item.variant?.product?.thumbnail || null
}

export function PickupDetailDrawer({
  order,
  open,
  onOpenChange,
  isPending,
  onMarkReady,
  onMarkPickedUp,
}: PickupDetailDrawerProps) {
  if (!order) return null

  const activeFf = getActiveFulfillment(order)
  const isReady = !!activeFf
  const unfulfilled = getUnfulfilledItems(order)
  const itemsToRender: RenderableItem[] =
    isReady && activeFf
      ? activeFf.items
          .map((fi) => {
            const orderItem = order.items.find((i) => i.id === fi.line_item_id)
            if (!orderItem) return null
            return { ...orderItem, unfulfilled_quantity: fi.quantity }
          })
          .filter((i): i is RenderableItem => !!i)
      : unfulfilled

  const totalUnits = itemsToRender.reduce(
    (acc, item) => acc + item.unfulfilled_quantity,
    0
  )

  const phone = order.shipping_address?.phone

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <div className="flex flex-col gap-y-1">
            <Drawer.Title asChild>
              <Heading level="h2">
                {LABELS.pickup.drawerTitle} — #{order.display_id}
              </Heading>
            </Drawer.Title>
            <Drawer.Description asChild>
              <Text size="small" className="text-ui-fg-subtle">
                {formatDate(order.created_at)} · {totalUnits}{" "}
                {totalUnits === 1
                  ? LABELS.pickup.itemsCountSingular
                  : LABELS.pickup.itemsCountPlural}
              </Text>
            </Drawer.Description>
          </div>
        </Drawer.Header>

        <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              {LABELS.pickup.drawerStatus}
            </Text>
            {isReady ? (
              <Badge color="green" size="small">
                {LABELS.pickup.statusReady}
              </Badge>
            ) : (
              <Badge color="orange" size="small">
                {LABELS.pickup.statusReceived}
              </Badge>
            )}
          </div>

          {/* Customer */}
          <div className="flex flex-col gap-y-1">
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              {LABELS.pickup.drawerCustomer}
            </Text>
            <Text size="small">{getRecipientName(order)}</Text>
            <Text size="small" className="text-ui-fg-subtle">
              {order.email}
            </Text>
            {phone && (
              <Text size="small" className="text-ui-fg-subtle">
                {phone}
              </Text>
            )}
          </div>

          {/* Items */}
          <div className="flex flex-col gap-y-3">
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              {LABELS.pickup.drawerItems}
            </Text>
            <div className="flex flex-col gap-y-2 rounded-lg border border-ui-border-base">
              {itemsToRender.map((item, idx) => {
                const thumb = getItemThumbnail(item)
                const sku = item.variant_sku || item.variant?.sku
                const isLast = idx === itemsToRender.length - 1
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-x-3 px-3 py-2.5 ${
                      isLast ? "" : "border-b border-ui-border-base"
                    }`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="h-12 w-12 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-ui-bg-subtle shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <Text size="small">
                        <span className="font-medium">
                          {item.unfulfilled_quantity}×
                        </span>{" "}
                        {item.product_title || item.title}
                      </Text>
                      {item.variant_title && (
                        <Text
                          size="xsmall"
                          className="text-ui-fg-subtle"
                        >
                          {item.variant_title}
                        </Text>
                      )}
                      {sku && (
                        <Text
                          size="xsmall"
                          className="text-ui-fg-muted font-mono"
                        >
                          {sku}
                        </Text>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary" size="small">
              {LABELS.pickup.drawerClose}
            </Button>
          </Drawer.Close>
          {isReady && activeFf ? (
            <Button
              size="small"
              disabled={isPending}
              isLoading={isPending}
              onClick={() => onMarkPickedUp(order.id, activeFf.id)}
            >
              {isPending
                ? LABELS.pickup.markPickedUpPending
                : LABELS.pickup.markPickedUpButton}
            </Button>
          ) : (
            <Button
              size="small"
              disabled={isPending || unfulfilled.length === 0}
              isLoading={isPending}
              onClick={() => onMarkReady(order.id)}
            >
              {isPending
                ? LABELS.pickup.markReadyPending
                : LABELS.pickup.markReadyButton}
            </Button>
          )}
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
