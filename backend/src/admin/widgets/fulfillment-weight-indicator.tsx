import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Text, Badge, Checkbox, Tooltip } from "@medusajs/ui"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { useState, useEffect, useCallback, useMemo } from "react"

type ItemWeight = {
  line_item_id: string
  title: string
  sku: string | null
  quantity: number
  weight_grams: number
  has_weight: boolean
  subtotal_grams: number
}

type MethodInfo = {
  sendcloud_id: number
  name: string
  min_weight_kg: number | null
  max_weight_kg: number | null
}

type CarrierGroupMethod = {
  sendcloud_id: number
  name: string
  min_weight_kg: number
  max_weight_kg: number
}

type WeightPreviewResponse = {
  total_weight_grams: number
  total_weight_kg: number
  items: ItemWeight[]
  items_without_weight_count: number
  items_without_weight: { line_item_id: string; title: string }[]
  carrier_group_name: string | null
  all_methods: CarrierGroupMethod[]
  selected_method: MethodInfo | null
  is_carrier_group: boolean
}

/**
 * Weight indicator widget for the order detail sidebar.
 *
 * Shows per-item weights, flags items using the 500g fallback,
 * and previews which Sendcloud shipping method would be selected
 * based on carrier group configuration.
 *
 * Interactive checkboxes let the admin simulate partial fulfillment
 * selection with live method feedback.
 */
const FulfillmentWeightIndicator = ({
  data: order,
}: DetailWidgetProps<AdminOrder>) => {
  const [preview, setPreview] = useState<WeightPreviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [initialized, setInitialized] = useState(false)

  const fetchPreview = useCallback(
    async (items?: { line_item_id: string; quantity: number }[]) => {
      if (!order?.id) return

      try {
        const response = await fetch("/admin/sendcloud/weight-preview", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: order.id,
            items: items?.length ? items : undefined,
          }),
        })

        if (response.ok) {
          const data: WeightPreviewResponse = await response.json()
          setPreview(data)

          if (!initialized && data.items.length > 0) {
            setSelectedItemIds(new Set(data.items.map((i) => i.line_item_id)))
            setInitialized(true)
          }
        }
      } catch (err) {
        console.error("[WeightIndicator] Error:", err)
      } finally {
        setLoading(false)
      }
    },
    [order?.id, initialized]
  )

  useEffect(() => {
    fetchPreview()
  }, [fetchPreview])

  const handleToggleItem = useCallback(
    (lineItemId: string) => {
      setSelectedItemIds((prev) => {
        const next = new Set(prev)
        if (next.has(lineItemId)) {
          next.delete(lineItemId)
        } else {
          next.add(lineItemId)
        }

        const selectedItems = preview?.items
          .filter((i) => next.has(i.line_item_id))
          .map((i) => ({ line_item_id: i.line_item_id, quantity: i.quantity }))

        if (selectedItems && selectedItems.length > 0) {
          fetchPreview(selectedItems)
        }

        return next
      })
    },
    [preview, fetchPreview]
  )

  const selectedWeight = useMemo(() => {
    if (!preview) return 0
    return preview.items
      .filter((i) => selectedItemIds.has(i.line_item_id))
      .reduce((sum, i) => sum + i.subtotal_grams, 0)
  }, [preview, selectedItemIds])

  const selectedWeightKg = Math.max(selectedWeight / 1000, 0.001)

  const selectedMethodForDisplay = useMemo(() => {
    if (!preview?.is_carrier_group || !preview.all_methods.length) {
      return preview?.selected_method
    }

    const sorted = [...preview.all_methods].sort(
      (a, b) => a.min_weight_kg - b.min_weight_kg
    )
    const candidates = sorted.filter(
      (m) => selectedWeightKg >= m.min_weight_kg && selectedWeightKg <= m.max_weight_kg
    )

    if (candidates.length === 0) return null

    return candidates.reduce((best, curr) =>
      curr.max_weight_kg - curr.min_weight_kg < best.max_weight_kg - best.min_weight_kg
        ? curr
        : best
    )
  }, [preview, selectedWeightKg])

  if (loading) return null
  if (!preview || preview.items.length === 0) return null

  const hasUnfulfilled = preview.items.length > 0

  if (!hasUnfulfilled) return null

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Versandgewicht
        </Text>
        {preview.is_carrier_group && preview.carrier_group_name && (
          <Text size="xsmall" className="text-ui-fg-subtle">
            Carrier-Gruppe: {preview.carrier_group_name}
          </Text>
        )}
      </div>

      {/* Weight warning for items without defined weight */}
      {preview.items_without_weight_count > 0 && (
        <div className="px-6 py-3 bg-ui-bg-field-component">
          <Text size="xsmall" className="text-ui-fg-warning">
            ⚠️ {preview.items_without_weight_count} Artikel ohne Gewicht
            — 500g Standard wird verwendet
          </Text>
        </div>
      )}

      {/* Per-item weight breakdown with checkboxes */}
      <div className="px-6 py-3 space-y-2">
        {preview.items.map((item) => {
          const isChecked = selectedItemIds.has(item.line_item_id)

          return (
            <div
              key={item.line_item_id}
              className="flex items-center gap-2"
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => handleToggleItem(item.line_item_id)}
              />
              <div className="flex-1 min-w-0">
                <Text size="xsmall" className="truncate">
                  {item.title}
                  {item.quantity > 1 && ` ×${item.quantity}`}
                </Text>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!item.has_weight && (
                  <Tooltip content="Kein Gewicht definiert — 500g Standard">
                    <Text size="xsmall" className="text-ui-fg-warning">
                      ⚠️
                    </Text>
                  </Tooltip>
                )}
                <Text size="xsmall" className="text-ui-fg-subtle font-mono">
                  {(item.subtotal_grams / 1000).toFixed(2)} kg
                </Text>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total weight + method selection */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <Text size="small" weight="plus">
            Gesamt: {selectedWeightKg.toFixed(3)} kg
          </Text>

          {selectedMethodForDisplay ? (
            <MethodBadge
              method={selectedMethodForDisplay}
              weightKg={selectedWeightKg}
              isCarrierGroup={preview.is_carrier_group}
              allMethods={preview.all_methods}
            />
          ) : preview.is_carrier_group ? (
            <Badge color="red" size="xsmall">
              Kein passender Tarif
            </Badge>
          ) : null}
        </div>

        {/* Threshold proximity warning */}
        {preview.is_carrier_group && selectedMethodForDisplay && (
          <ThresholdWarning
            method={selectedMethodForDisplay as CarrierGroupMethod}
            weightKg={selectedWeightKg}
          />
        )}
      </div>
    </Container>
  )
}

/**
 * Displays the selected shipping method as a colored badge.
 * Color changes when crossing a weight threshold.
 */
function MethodBadge({
  method,
  weightKg,
  isCarrierGroup,
  allMethods,
}: {
  method: MethodInfo | CarrierGroupMethod
  weightKg: number
  isCarrierGroup: boolean
  allMethods: CarrierGroupMethod[]
}) {
  if (!isCarrierGroup) {
    return (
      <Badge color="grey" size="xsmall">
        {method.name}
      </Badge>
    )
  }

  const sorted = [...allMethods].sort((a, b) => a.min_weight_kg - b.min_weight_kg)
  const methodIndex = sorted.findIndex(
    (m) => m.sendcloud_id === method.sendcloud_id
  )

  // Color scheme: first tier = green, middle = blue, last = orange
  const color: "green" | "blue" | "orange" =
    methodIndex === 0
      ? "green"
      : methodIndex === sorted.length - 1
      ? "orange"
      : "blue"

  const label =
    method.min_weight_kg != null && method.max_weight_kg != null
      ? `${method.name} (${weightKg.toFixed(1)} kg)`
      : method.name

  return (
    <Badge color={color} size="xsmall">
      {label}
    </Badge>
  )
}

/**
 * Shows a subtle hint when the weight is close to a tier boundary.
 */
function ThresholdWarning({
  method,
  weightKg,
}: {
  method: CarrierGroupMethod
  weightKg: number
}) {
  const range = method.max_weight_kg - method.min_weight_kg
  const proximityThreshold = range * 0.1

  const nearUpper = method.max_weight_kg - weightKg <= proximityThreshold && weightKg < method.max_weight_kg
  const nearLower = weightKg - method.min_weight_kg <= proximityThreshold && weightKg > method.min_weight_kg

  if (!nearUpper && !nearLower) return null

  const message = nearUpper
    ? `Nahe am Limit von ${method.max_weight_kg} kg — nächsthöherer Tarif ab ${method.max_weight_kg} kg`
    : `Knapp über Untergrenze von ${method.min_weight_kg} kg`

  return (
    <Text size="xsmall" className="text-ui-fg-warning mt-1">
      ⚡ {message}
    </Text>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default FulfillmentWeightIndicator
