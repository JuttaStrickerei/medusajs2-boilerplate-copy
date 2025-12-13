import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { cancelOrderFulfillmentWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Custom cancel endpoint that overrides Medusa's standard endpoint.
 * 
 * POST /admin/orders/:id/fulfillments/:fulfillment_id/cancel
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: order_id, fulfillment_id } = req.params

  console.log("\n" + "=".repeat(80))
  console.log(`[CustomCancelFulfillment] Canceling fulfillment ${fulfillment_id}`)
  console.log(`[CustomCancelFulfillment] Order: ${order_id}`)
  console.log("=".repeat(80))

  try {
    const { result } = await cancelOrderFulfillmentWorkflow(req.scope).run({
      input: {
        order_id,
        fulfillment_id,
      },
    })

    console.log(`[CustomCancelFulfillment] ✅ Fulfillment canceled successfully`)
    console.log("=".repeat(80) + "\n")

    res.status(200).json({ order: result })
  } catch (error) {
    console.error("[CustomCancelFulfillment] ❌ Error:", error)
    console.error("=".repeat(80) + "\n")

    const message = error instanceof Error ? error.message : "Unknown error"
    res.status(500).json({ message })
  }
}
