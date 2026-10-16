import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  updateCartsStep,
  updateOrdersStep,
} from "@medusajs/medusa/core-flows"
import { ATTRIBUTION_KEY } from "../modules/meta-capi/purchase-event"

type ClearMetaAttributionWorkflowInput = {
  order_id: string
  cart_id?: string | null
  // e.g. { meta_capi_sent_at: "…" } or { meta_capi_error: "…" }
  result: Record<string, string>
}

// Deletes the Meta attribution (IP, browser, _fbp/_fbc) from the order and
// its cart once the purchase is reported, as the privacy page promises.
// Not updateOrderWorkflow: that keeps the old metadata in an order change.
// Metadata updates merge, and an empty string deletes the key.
export const clearMetaAttributionWorkflow = createWorkflow(
  "clear-meta-attribution",
  function (input: ClearMetaAttributionWorkflowInput) {
    const orderUpdate = transform({ input }, ({ input }) => ({
      selector: { id: input.order_id },
      update: { metadata: { [ATTRIBUTION_KEY]: "", ...input.result } },
    }))
    updateOrdersStep(orderUpdate)

    when({ input }, ({ input }) => !!input.cart_id).then(() => {
      const cartUpdate = transform({ input }, ({ input }) => [
        { id: input.cart_id as string, metadata: { [ATTRIBUTION_KEY]: "" } },
      ])
      updateCartsStep(cartUpdate)
    })

    return new WorkflowResponse(void 0)
  }
)

export default clearMetaAttributionWorkflow
