import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

type WeightPreviewItem = {
  line_item_id: string
  quantity: number
}

type WeightPreviewBody = {
  order_id: string
  items?: WeightPreviewItem[]
}

/**
 * POST /admin/sendcloud/weight-preview
 *
 * Previews which Sendcloud shipping method would be selected
 * for a given set of order items based on their total weight.
 * Used by the admin weight indicator widget for live feedback.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const body = req.body as WeightPreviewBody
    const { order_id, items: selectedItems } = body

    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" })
    }

    const query = req.scope.resolve("query") as any

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "items.id",
        "items.title",
        "items.quantity",
        "items.variant_sku",
        "items.variant.id",
        "items.variant.sku",
        "items.variant.title",
        "items.variant.weight",
        "items.variant.product.weight",
        "shipping_methods.data",
        "shipping_methods.shipping_option_id",
      ],
      filters: { id: order_id },
    })

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Order not found" })
    }

    const order = orders[0] as any
    const orderItems = (order.items || []) as any[]

    // Determine which items to preview (all or specific selection)
    const itemsToPreview = selectedItems?.length
      ? orderItems.filter((oi: any) =>
          selectedItems.some((si) => si.line_item_id === oi.id)
        )
      : orderItems

    const DEFAULT_WEIGHT_GRAMS = 500

    // Build weight breakdown per item
    const itemWeights = itemsToPreview.map((item: any) => {
      const selectedQuantity = selectedItems?.find(
        (si) => si.line_item_id === item.id
      )?.quantity ?? item.quantity

      let weightGrams = DEFAULT_WEIGHT_GRAMS
      let hasWeight = false

      if (item.variant?.weight && item.variant.weight > 0) {
        weightGrams = item.variant.weight
        hasWeight = true
      } else if (item.variant?.product?.weight && item.variant.product.weight > 0) {
        weightGrams = item.variant.product.weight
        hasWeight = true
      }

      return {
        line_item_id: item.id,
        title: item.title || item.variant?.title || "Unknown",
        sku: item.variant?.sku || item.variant_sku || null,
        quantity: selectedQuantity,
        weight_grams: weightGrams,
        has_weight: hasWeight,
        subtotal_grams: weightGrams * selectedQuantity,
      }
    })

    const totalWeightGrams = itemWeights.reduce(
      (sum: number, i: any) => sum + i.subtotal_grams,
      0
    )
    const totalWeightKg = Math.max(totalWeightGrams / 1000, 0.001)
    const itemsWithoutWeight = itemWeights.filter((i: any) => !i.has_weight)

    // Try to find carrier group config from the order's shipping method
    let selectedMethod: any = null
    let carrierGroupName: string | null = null
    let allMethods: any[] = []

    const shippingMethod = order.shipping_methods?.[0]
    const shippingData = shippingMethod?.data as Record<string, any> | undefined

    // Check nested and flat data structures for carrier group flag
    const cgSource =
      (shippingData?.data as any)?.carrier_group === true ? shippingData?.data :
      shippingData?.carrier_group === true ? shippingData :
      null

    if (cgSource && Array.isArray(cgSource.methods)) {
      carrierGroupName = cgSource.carrier_group_name || cgSource.carrier_group_id || null
      allMethods = cgSource.methods

      const sorted = [...cgSource.methods].sort(
        (a: any, b: any) => a.min_weight_kg - b.min_weight_kg
      )

      const candidates = sorted.filter(
        (m: any) => totalWeightKg >= m.min_weight_kg && totalWeightKg <= m.max_weight_kg
      )

      if (candidates.length > 0) {
        const best = candidates.reduce((a: any, b: any) =>
          (b.max_weight_kg - b.min_weight_kg) < (a.max_weight_kg - a.min_weight_kg) ? b : a
        )

        selectedMethod = {
          sendcloud_id: best.sendcloud_id,
          name: best.name || `Method ${best.sendcloud_id}`,
          min_weight_kg: best.min_weight_kg,
          max_weight_kg: best.max_weight_kg,
        }
      }
    } else {
      // Legacy single-method: extract sendcloud_id for display
      const sendcloudId =
        (shippingData?.data as any)?.sendcloud_id ||
        shippingData?.sendcloud_id

      if (sendcloudId) {
        const methodName = (shippingData?.data as any)?.name || shippingData?.name
        selectedMethod = {
          sendcloud_id: sendcloudId,
          name: methodName || `Sendcloud #${sendcloudId}`,
          min_weight_kg: null,
          max_weight_kg: null,
        }
      }
    }

    return res.json({
      total_weight_grams: totalWeightGrams,
      total_weight_kg: parseFloat(totalWeightKg.toFixed(3)),
      items: itemWeights,
      items_without_weight_count: itemsWithoutWeight.length,
      items_without_weight: itemsWithoutWeight.map((i: any) => ({
        line_item_id: i.line_item_id,
        title: i.title,
      })),
      carrier_group_name: carrierGroupName,
      all_methods: allMethods,
      selected_method: selectedMethod,
      is_carrier_group: !!cgSource,
    })
  } catch (error) {
    console.error("[WeightPreview] Error:", error)
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
