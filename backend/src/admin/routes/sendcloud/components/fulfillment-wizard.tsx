import {
  FocusModal,
  Button,
  Text,
  Badge,
  Checkbox,
  toast,
  Heading,
} from "@medusajs/ui"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../../../admin/lib/sdk"
import { LABELS, mapFulfillmentError } from "./dashboard-labels"
import type { OpenOrder, OrderItem, WizardStep } from "./types"

type FulfillmentWizardProps = {
  orderId: string | null
  onClose: () => void
  onCompleted: () => void
}

const DEFAULT_WEIGHT_GRAMS = 500

function getItemWeight(item: OrderItem): number {
  return item.variant?.weight ?? DEFAULT_WEIGHT_GRAMS
}

function getUnfulfilledQuantity(item: OrderItem, order: OpenOrder): number {
  let fulfilledQty = 0
  for (const ff of order.fulfillments || []) {
    if (ff.canceled_at) continue
    for (const fi of ff.items || []) {
      if (fi.line_item_id === item.id) {
        fulfilledQty += fi.quantity
      }
    }
  }
  return Math.max(0, item.quantity - fulfilledQty)
}

function getItemThumbnail(item: OrderItem): string | null {
  return item.thumbnail || item.variant?.product?.thumbnail || null
}

export function FulfillmentWizard({ orderId, onClose, onCompleted }: FulfillmentWizardProps) {
  const [step, setStep] = useState<WizardStep>(1)
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map())
  const [locationId, setLocationId] = useState<string | null>(null)
  const [createdFulfillment, setCreatedFulfillment] = useState<any>(null)
  const [packedItems, setPackedItems] = useState<Set<string>>(new Set())
  const [documentDownloaded, setDocumentDownloaded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const queryClient = useQueryClient()

  const orderQuery = useQuery({
    queryKey: ["wizard-order", orderId],
    queryFn: () =>
      sdk.client.fetch(`/admin/orders/${orderId}`, {
        method: "GET",
        query: {
          fields:
            "+items.*,+items.variant.*,+items.variant.product.*,+shipping_address.*,+shipping_methods.*,+fulfillments.*,+fulfillments.items.*,+fulfillments.labels.*",
        },
      }),
    enabled: !!orderId,
  })

  const locationsQuery = useQuery({
    queryKey: ["stock-locations"],
    queryFn: () => sdk.client.fetch("/admin/stock-locations", { method: "GET" }),
    enabled: !!orderId,
  })

  const order = (orderQuery.data as any)?.order as OpenOrder | undefined
  const locations = (locationsQuery.data as any)?.stock_locations as any[] | undefined

  useEffect(() => {
    if (locations?.length === 1 && !locationId) {
      setLocationId(locations[0].id)
    }
  }, [locations, locationId])

  const unfulfilledItems = useMemo(() => {
    if (!order) return []
    return order.items
      .map((item) => ({
        ...item,
        unfulfilled_quantity: getUnfulfilledQuantity(item, order),
      }))
      .filter((item) => item.unfulfilled_quantity > 0)
  }, [order])

  useEffect(() => {
    if (unfulfilledItems.length > 0 && selectedItems.size === 0) {
      const initial = new Map<string, number>()
      for (const item of unfulfilledItems) {
        initial.set(item.id, item.unfulfilled_quantity)
      }
      setSelectedItems(initial)
    }
  }, [unfulfilledItems, selectedItems.size])

  const toggleItem = useCallback((itemId: string, maxQty: number) => {
    setSelectedItems((prev) => {
      const next = new Map(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.set(itemId, maxQty)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    const next = new Map<string, number>()
    for (const item of unfulfilledItems) next.set(item.id, item.unfulfilled_quantity)
    setSelectedItems(next)
  }, [unfulfilledItems])

  const deselectAll = useCallback(() => setSelectedItems(new Map()), [])

  const totalWeight = useMemo(() => {
    let total = 0
    for (const [itemId, qty] of selectedItems) {
      const item = unfulfilledItems.find((i) => i.id === itemId)
      if (item) total += getItemWeight(item) * qty
    }
    return total
  }, [selectedItems, unfulfilledItems])

  const totalWeightKg = (totalWeight / 1000).toFixed(3)

  const selectedItemDetails = useMemo(() => {
    return Array.from(selectedItems.entries())
      .map(([id, qty]) => {
        const item = unfulfilledItems.find((i) => i.id === id)
        return item ? { ...item, selectedQty: qty } : null
      })
      .filter(Boolean) as (typeof unfulfilledItems[number] & { selectedQty: number })[]
  }, [selectedItems, unfulfilledItems])

  const createFulfillmentMutation = useMutation({
    mutationFn: async () => {
      const items = Array.from(selectedItems.entries()).map(([id, quantity]) => ({ id, quantity }))
      const body: Record<string, unknown> = { items }
      if (locationId) body.location_id = locationId
      await sdk.client.fetch(`/admin/orders/${orderId}/fulfillments`, { method: "POST", body })

      const refreshed = await sdk.client.fetch(`/admin/orders/${orderId}`, {
        method: "GET",
        query: { fields: "+fulfillments.*,+fulfillments.labels.*" },
      }) as any
      const fulfillments = (refreshed?.order?.fulfillments || [])
        .filter((f: any) => !f.canceled_at)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      return fulfillments[0] || null
    },
    onSuccess: (latestFf: any) => {
      setCreatedFulfillment(latestFf)
      setStep(3)
      queryClient.invalidateQueries({ queryKey: ["dashboard-open-orders"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-shipments"] })
    },
    onError: (error: any) => {
      toast.error(mapFulfillmentError(error?.message || error?.body?.message || String(error)))
    },
  })

  const getParcelId = useCallback((): string | null => {
    const ffData = createdFulfillment?.data || {}
    return ffData.parcel_id ? String(ffData.parcel_id) : null
  }, [createdFulfillment])

  const downloadDocument = useCallback(
    async (type: "combined" | "packing-slip" | "label") => {
      const parcelId = getParcelId()
      if (!parcelId || !orderId) {
        toast.error("Keine Parcel-ID vorhanden")
        return
      }

      setIsDownloading(true)
      try {
        const response = await fetch(
          `/admin/sendcloud/shipping-documents/${parcelId}?order_id=${orderId}&type=${type}`,
          { credentials: "include" }
        )
        if (!response.ok) throw new Error("Download failed")
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const displayId = order?.display_id || parcelId
        const names = { combined: `versand-${displayId}`, "packing-slip": `lieferschein-${displayId}`, label: `label-${displayId}` }
        a.download = `${names[type]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setDocumentDownloaded(true)
        toast.success("Dokument heruntergeladen")
      } catch {
        toast.error(LABELS.wizard.packStep2Failed)
      } finally {
        setIsDownloading(false)
      }
    },
    [getParcelId, orderId, order?.display_id]
  )

  const handleDone = useCallback(() => {
    setStep(1)
    setSelectedItems(new Map())
    setCreatedFulfillment(null)
    setPackedItems(new Set())
    setDocumentDownloaded(false)
    onCompleted()
  }, [onCompleted])

  if (!orderId) return null

  const isLoading = orderQuery.isLoading || locationsQuery.isLoading
  const hasError = orderQuery.isError

  const remainingAfterFulfill = unfulfilledItems.reduce((sum, item) => {
    const selected = selectedItems.get(item.id) || 0
    return sum + (item.unfulfilled_quantity - selected)
  }, 0)

  const stepLabel =
    step === 1
      ? LABELS.wizard.stepItemSelection
      : step === 2
        ? LABELS.wizard.stepConfirmation
        : LABELS.wizard.stepPackAndShip

  return (
    <FocusModal open={!!orderId} onOpenChange={(open) => !open && step < 3 && onClose()}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center gap-x-4">
            <Text size="small" weight="plus">{stepLabel}</Text>
            <div className="flex items-center gap-x-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step ? "w-6 bg-ui-fg-interactive" : s < step ? "w-3 bg-ui-fg-interactive" : "w-3 bg-ui-bg-switch-off"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-x-2">
            {step < 3 && (
              <FocusModal.Close asChild>
                <Button variant="secondary" size="small">{LABELS.wizard.cancel}</Button>
              </FocusModal.Close>
            )}
            {step === 1 && (
              <Button size="small" disabled={selectedItems.size === 0} onClick={() => setStep(2)}>
                {LABELS.wizard.continue}
              </Button>
            )}
            {step === 2 && (
              <>
                <Button variant="secondary" size="small" onClick={() => setStep(1)}>
                  {LABELS.wizard.back}
                </Button>
                <Button
                  size="small"
                  disabled={createFulfillmentMutation.isPending}
                  isLoading={createFulfillmentMutation.isPending}
                  onClick={() => createFulfillmentMutation.mutate()}
                >
                  {createFulfillmentMutation.isPending ? LABELS.wizard.creating : LABELS.wizard.createShipment}
                </Button>
              </>
            )}
            {step === 3 && (
              <Button size="small" onClick={handleDone}>{LABELS.wizard.packDone}</Button>
            )}
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="flex flex-col gap-y-4 overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Text className="text-ui-fg-subtle">{LABELS.wizard.loadingOrder}</Text>
            </div>
          )}
          {hasError && (
            <div className="flex items-center justify-center py-12">
              <Text className="text-ui-fg-error">{LABELS.wizard.orderLoadFailed}</Text>
            </div>
          )}

          {!isLoading && !hasError && order && step === 1 && (
            <StepItemSelection
              order={order}
              unfulfilledItems={unfulfilledItems}
              selectedItems={selectedItems}
              toggleItem={toggleItem}
              selectAll={selectAll}
              deselectAll={deselectAll}
              totalWeightKg={totalWeightKg}
              locations={locations}
              locationId={locationId}
              onLocationChange={setLocationId}
            />
          )}

          {!isLoading && !hasError && order && step === 2 && (
            <StepConfirmation
              order={order}
              unfulfilledItems={unfulfilledItems}
              selectedItems={selectedItems}
              totalWeightKg={totalWeightKg}
            />
          )}

          {step === 3 && (
            <StepPackAndShip
              selectedItemDetails={selectedItemDetails}
              packedItems={packedItems}
              setPackedItems={setPackedItems}
              documentDownloaded={documentDownloaded}
              isDownloading={isDownloading}
              downloadDocument={downloadDocument}
              createdFulfillment={createdFulfillment}
              remainingCount={remainingAfterFulfill}
            />
          )}
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}

type ItemWithUnfulfilled = OrderItem & { unfulfilled_quantity: number }

function StepItemSelection({
  order,
  unfulfilledItems,
  selectedItems,
  toggleItem,
  selectAll,
  deselectAll,
  totalWeightKg,
  locations,
  locationId,
  onLocationChange,
}: {
  order: OpenOrder
  unfulfilledItems: ItemWithUnfulfilled[]
  selectedItems: Map<string, number>
  toggleItem: (id: string, maxQty: number) => void
  selectAll: () => void
  deselectAll: () => void
  totalWeightKg: string
  locations: any[] | undefined
  locationId: string | null
  onLocationChange: (id: string) => void
}) {
  if (unfulfilledItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Text className="text-ui-fg-subtle">{LABELS.wizard.noItemsToFulfill}</Text>
      </div>
    )
  }

  const allSelected = selectedItems.size === unfulfilledItems.length

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <Heading level="h2">
          {LABELS.openOrders.orderPrefix} #{order.display_id}
        </Heading>
        <Button variant="transparent" size="small" onClick={allSelected ? deselectAll : selectAll}>
          {allSelected ? LABELS.wizard.deselectAll : LABELS.wizard.selectAll}
        </Button>
      </div>

      {locations && locations.length > 1 && (
        <div className="flex items-center gap-x-2">
          <Text size="small" weight="plus">{LABELS.wizard.locationSelect}:</Text>
          <select
            className="rounded border border-ui-border-base bg-ui-bg-field px-2 py-1 text-sm"
            value={locationId || ""}
            onChange={(e) => onLocationChange(e.target.value)}
          >
            {locations.map((loc: any) => (
              <option key={loc.id} value={loc.id}>{loc.name || loc.id}</option>
            ))}
          </select>
        </div>
      )}

      {locations && locations.length === 0 && (
        <div className="rounded-lg bg-ui-bg-field-component p-3">
          <Text className="text-ui-fg-error" size="small">{LABELS.wizard.noLocations}</Text>
        </div>
      )}

      <div className="flex flex-col gap-y-2">
        {unfulfilledItems.map((item) => {
          const isSelected = selectedItems.has(item.id)
          const weightG = getItemWeight(item)
          const hasDefaultWeight = !item.variant?.weight
          const thumb = getItemThumbnail(item)

          return (
            <div
              key={item.id}
              className={`flex items-center gap-x-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                isSelected ? "border-ui-border-interactive bg-ui-bg-interactive/5" : "border-ui-border-base bg-ui-bg-field"
              }`}
              onClick={() => toggleItem(item.id, item.unfulfilled_quantity)}
            >
              <Checkbox checked={isSelected} onCheckedChange={() => toggleItem(item.id, item.unfulfilled_quantity)} />
              {thumb ? (
                <img src={thumb} alt="" className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-ui-bg-subtle">
                  <Text className="text-ui-fg-muted" size="xsmall">—</Text>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Text size="small" weight="plus" className="truncate">{item.title || item.product_title}</Text>
                <div className="flex items-center gap-x-2">
                  {item.variant_title && <Text size="xsmall" className="text-ui-fg-subtle">{item.variant_title}</Text>}
                  {(item.variant_sku || item.variant?.sku) && (
                    <Text size="xsmall" className="text-ui-fg-muted font-mono">{LABELS.wizard.sku}: {item.variant_sku || item.variant?.sku}</Text>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-x-4 text-right">
                <div>
                  <Text size="xsmall" className="text-ui-fg-subtle">{LABELS.wizard.quantity}</Text>
                  <Text size="small" weight="plus">{item.unfulfilled_quantity}×</Text>
                </div>
                <div>
                  <Text size="xsmall" className="text-ui-fg-subtle">{LABELS.wizard.weight}</Text>
                  <div className="flex items-center gap-x-1">
                    <Text size="small" weight="plus">{weightG}g</Text>
                    {hasDefaultWeight && <Badge color="orange" size="2xsmall">⚠</Badge>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-ui-bg-subtle p-3">
        <Text size="small" weight="plus">{LABELS.wizard.selectedSummary(selectedItems.size, totalWeightKg)}</Text>
      </div>
    </div>
  )
}

function StepConfirmation({
  order, unfulfilledItems, selectedItems, totalWeightKg,
}: {
  order: OpenOrder
  unfulfilledItems: ItemWithUnfulfilled[]
  selectedItems: Map<string, number>
  totalWeightKg: string
}) {
  const addr = order.shipping_address
  return (
    <div className="flex flex-col gap-y-6">
      <div>
        <Heading level="h2">{LABELS.wizard.confirmTitle}</Heading>
        <Text className="text-ui-fg-subtle" size="small">{LABELS.wizard.confirmSubtitle}</Text>
      </div>
      {addr && (
        <div className="rounded-lg border border-ui-border-base p-4">
          <Text size="small" weight="plus" className="mb-2">{LABELS.wizard.shippingTo}</Text>
          <Text size="small">{addr.first_name} {addr.last_name}</Text>
          {addr.company && <Text size="small" className="text-ui-fg-subtle">{addr.company}</Text>}
          <Text size="small">{addr.address_1} {addr.address_2}</Text>
          <Text size="small">{addr.postal_code} {addr.city}</Text>
          <Text size="small">{addr.country_code?.toUpperCase()}</Text>
        </div>
      )}
      <div className="rounded-lg border border-ui-border-base p-4">
        <Text size="small" weight="plus" className="mb-3">{LABELS.wizard.itemsToShip} ({selectedItems.size})</Text>
        <div className="flex flex-col gap-y-2">
          {Array.from(selectedItems.entries()).map(([itemId, qty]) => {
            const item = unfulfilledItems.find((i) => i.id === itemId)
            if (!item) return null
            return (
              <div key={itemId} className="flex items-center justify-between">
                <Text size="small">{qty}× {item.title || item.product_title}{item.variant_title ? ` (${item.variant_title})` : ""}</Text>
                <Text size="small" className="text-ui-fg-subtle">{(getItemWeight(item) * qty / 1000).toFixed(3)} kg</Text>
              </div>
            )
          })}
        </div>
        <div className="mt-3 border-t border-ui-border-base pt-3 flex items-center justify-between">
          <Text size="small" weight="plus">{LABELS.wizard.totalWeight}</Text>
          <Text size="small" weight="plus">{totalWeightKg} kg</Text>
        </div>
      </div>
    </div>
  )
}

function StepPackAndShip({
  selectedItemDetails,
  packedItems,
  setPackedItems,
  documentDownloaded,
  isDownloading,
  downloadDocument,
  createdFulfillment,
  remainingCount,
}: {
  selectedItemDetails: (ItemWithUnfulfilled & { selectedQty: number })[]
  packedItems: Set<string>
  setPackedItems: React.Dispatch<React.SetStateAction<Set<string>>>
  documentDownloaded: boolean
  isDownloading: boolean
  downloadDocument: (type: "combined" | "packing-slip" | "label") => Promise<void>
  createdFulfillment: any
  remainingCount: number
}) {
  const ffData = createdFulfillment?.data || {}
  const trackingNumber = ffData.tracking_number || createdFulfillment?.labels?.[0]?.tracking_number
  const trackingUrl = ffData.tracking_url || createdFulfillment?.labels?.[0]?.tracking_url
  const allPacked = packedItems.size === selectedItemDetails.length && selectedItemDetails.length > 0

  const togglePacked = (itemId: string) => {
    setPackedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-y-6">
      {trackingNumber && (
        <div className="flex items-center justify-between rounded-lg bg-ui-bg-subtle p-3">
          <div>
            <Text size="xsmall" className="text-ui-fg-subtle">{LABELS.wizard.trackingNumber}</Text>
            <Text size="small" weight="plus" className="font-mono">{trackingNumber}</Text>
          </div>
          {trackingUrl && (
            <Button variant="transparent" size="small" onClick={() => window.open(trackingUrl, "_blank")}>
              Tracking →
            </Button>
          )}
        </div>
      )}

      {/* Sub-step 1: Pack items */}
      <div className="rounded-lg border border-ui-border-base overflow-hidden">
        <div className={`flex items-center gap-x-3 px-4 py-3 ${allPacked ? "bg-ui-bg-interactive/10" : "bg-ui-bg-field"}`}>
          <StepCircle done={allPacked} number={1} />
          <div>
            <Text size="small" weight="plus">{LABELS.wizard.packStep1Title}</Text>
            <Text size="xsmall" className="text-ui-fg-subtle">{LABELS.wizard.packStep1Desc}</Text>
          </div>
        </div>
        <div className="px-4 py-3 flex flex-col gap-y-2">
          {selectedItemDetails.map((item) => {
            const isPacked = packedItems.has(item.id)
            const thumb = getItemThumbnail(item)
            return (
              <div
                key={item.id}
                className={`flex items-center gap-x-3 rounded-lg p-2 cursor-pointer transition-colors ${
                  isPacked ? "bg-ui-bg-interactive/5" : "bg-ui-bg-base"
                }`}
                onClick={() => togglePacked(item.id)}
              >
                <Checkbox checked={isPacked} onCheckedChange={() => togglePacked(item.id)} />
                {thumb ? (
                  <img src={thumb} alt="" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-ui-bg-subtle">
                    <Text className="text-ui-fg-muted" size="xsmall">—</Text>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Text size="small" className={isPacked ? "line-through text-ui-fg-muted" : ""}>
                    {item.selectedQty}× {item.title || item.product_title}
                    {item.variant_title ? ` (${item.variant_title})` : ""}
                  </Text>
                </div>
                {isPacked && <Badge color="green" size="2xsmall">{LABELS.wizard.packItemPacked}</Badge>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sub-step 2: Print documents */}
      <div className="rounded-lg border border-ui-border-base overflow-hidden">
        <div className={`flex items-center gap-x-3 px-4 py-3 ${documentDownloaded ? "bg-ui-bg-interactive/10" : "bg-ui-bg-field"}`}>
          <StepCircle done={documentDownloaded} number={2} />
          <div>
            <Text size="small" weight="plus">{LABELS.wizard.packStep2Title}</Text>
            <Text size="xsmall" className="text-ui-fg-subtle">{LABELS.wizard.packStep2Desc}</Text>
          </div>
        </div>
        <div className="px-4 py-3 flex flex-col gap-y-3">
          <Button
            onClick={() => downloadDocument("combined")}
            disabled={isDownloading}
            isLoading={isDownloading}
            className="w-full"
          >
            {isDownloading ? LABELS.wizard.packStep2Downloading : LABELS.wizard.packStep2Button}
          </Button>

          <div className="flex items-center gap-x-2">
            <div className="flex-1 rounded-lg border border-ui-border-base p-3 flex items-center justify-between">
              <div>
                <Text size="small" weight="plus">Lieferschein</Text>
                <Text size="xsmall" className="text-ui-fg-muted">→ ins Paket legen</Text>
              </div>
              <Button variant="secondary" size="small" onClick={() => downloadDocument("packing-slip")} disabled={isDownloading}>
                PDF
              </Button>
            </div>
            <div className="flex-1 rounded-lg border border-ui-border-base p-3 flex items-center justify-between">
              <div>
                <Text size="small" weight="plus">Versandlabel</Text>
                <Text size="xsmall" className="text-ui-fg-muted">→ auf das Paket kleben</Text>
              </div>
              <Button variant="secondary" size="small" onClick={() => downloadDocument("label")} disabled={isDownloading}>
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-step 3: Close package */}
      <div className="rounded-lg border border-ui-border-base overflow-hidden">
        <div className={`flex items-center gap-x-3 px-4 py-3 ${allPacked && documentDownloaded ? "bg-ui-bg-interactive/10" : "bg-ui-bg-field"}`}>
          <StepCircle done={allPacked && documentDownloaded} number={3} />
          <div>
            <Text size="small" weight="plus">{LABELS.wizard.packStep3Title}</Text>
            <Text size="xsmall" className="text-ui-fg-subtle">{LABELS.wizard.packStep3Desc}</Text>
          </div>
        </div>
      </div>

      {remainingCount > 0 && (
        <div className="rounded-lg bg-ui-bg-field-component p-3">
          <Text size="small" className="text-ui-fg-subtle">{LABELS.wizard.remainingNote(remainingCount)}</Text>
        </div>
      )}
    </div>
  )
}

function StepCircle({ done, number }: { done: boolean; number: number }) {
  return (
    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
      done ? "bg-ui-tag-green-bg text-ui-tag-green-text" : "bg-ui-bg-base border border-ui-border-base text-ui-fg-subtle"
    }`}>
      {done ? "✓" : String(number)}
    </div>
  )
}
