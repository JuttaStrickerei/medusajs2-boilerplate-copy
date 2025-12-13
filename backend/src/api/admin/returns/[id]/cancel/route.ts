import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { 
  cancelReturnWorkflow,
  cancelFulfillmentWorkflow 
} from "@medusajs/medusa/core-flows"

/**
 * Custom endpoint to cancel a return WITH its fulfillments
 * 
 * POST /admin/returns/:id/cancel
 * 
 * Automatically cancels all return fulfillments FIRST,
 * then cancels the return - making it a one-click operation.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const return_id = req.params.id

  try {
    const query = req.scope.resolve("query")
    const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT)

    // Step 1: Get the return with its fulfillments
    const { data: returns } = await query.graph({
      entity: "return",
      fields: [
        "id",
        "status",
        "order_id",
        "fulfillments.*",
      ],
      filters: { id: return_id },
    })

    if (!returns || returns.length === 0) {
      return res.status(404).json({
        message: `Return ${return_id} not found`,
      })
    }

    const returnData = returns[0]
    const fulfillments = returnData.fulfillments || []

    // Step 2: Cancel all non-canceled fulfillments FIRST
    const activeFulfillments = fulfillments.filter((f: any) => !f.canceled_at)
    
    for (const fulfillment of activeFulfillments) {
      try {
        // Check if already shipped - can't cancel shipped fulfillments
        if (fulfillment.shipped_at) continue

        // Use cancelFulfillmentWorkflow - this calls the provider's cancelFulfillment method
        await cancelFulfillmentWorkflow(req.scope).run({
          input: { id: fulfillment.id },
        })
      } catch (fulfillmentError) {
        const errorMsg = fulfillmentError instanceof Error ? fulfillmentError.message : String(fulfillmentError)
        
        // Check if the error indicates the parcel doesn't exist in Sendcloud
        const isAlreadyDeleted = 
          errorMsg.includes("No Parcel") || 
          errorMsg.includes("not found") || 
          errorMsg.includes("deleted") ||
          errorMsg.includes("Gone") ||
          errorMsg.includes("404") ||
          errorMsg.includes("does not exist")
        
        if (isAlreadyDeleted) {
          // Mark the fulfillment as canceled in Medusa even though Sendcloud parcel is gone
          try {
            await fulfillmentService.cancelFulfillment(fulfillment.id)
          } catch (cancelError) {
            // Already canceled or other error - continue
          }
        } else {
          console.error("[CancelReturn] Error canceling fulfillment:", errorMsg)
        }
      }
    }

    // Step 3: Now cancel the return itself
    const { result } = await cancelReturnWorkflow(req.scope).run({
      input: {
        return_id: return_id,
        no_notification: (req.body as any)?.no_notification,
        canceled_by: (req.body as any)?.canceled_by,
      },
    })

    res.status(200).json({
      return: result,
    })

  } catch (error) {
    console.error("[CancelReturn] Error:", error instanceof Error ? error.message : error)
    
    const message = error instanceof Error ? error.message : "Unknown error"
    res.status(500).json({
      message: `Failed to cancel return: ${message}`,
    })
  }
}
