import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { confirmReturnRequestWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Custom return request endpoint that uses Medusa's STANDARD workflow.
 * 
 * This overrides Medusa's default POST /admin/returns/:id/request endpoint.
 * 
 * The Sendcloud provider will fetch order data itself using this.container_
 * (note the underscore - this is the correct way in Medusa v2).
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("\n" + "=".repeat(80))
  console.log("[ReturnRequest] Using STANDARD Medusa workflow")
  console.log("[ReturnRequest] Provider will fetch order data via container_")
  console.log("=".repeat(80))

  const return_id = req.params.id

  try {
    console.log("[ReturnRequest] Return ID:", return_id)
    
    // Use Medusa's standard confirmReturnRequestWorkflow
    // The provider will fetch order data using this.container_
    const { result } = await confirmReturnRequestWorkflow(req.scope).run({
      input: { return_id },
    })
    
    console.log("\n" + "=".repeat(80))
    console.log("[ReturnRequest] ✅ Standard workflow completed")
    console.log("=".repeat(80) + "\n")
    
    res.status(200).json({ return: result })
  } catch (error) {
    console.error("\n" + "=".repeat(80))
    console.error("[ReturnRequest] ❌ Error:", error)
    console.error("=".repeat(80) + "\n")
    throw error
  }
}
