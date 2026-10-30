import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateOrdersStep } from "@medusajs/medusa/core-flows"

// Answers to "Wie haben Sie von uns erfahren?" on the order confirmation page
// (storefront modules/order/components/order-source-survey)
export const ORDER_SOURCES = [
  "instagram",
  "facebook",
  "google",
  "empfehlung",
  "geschaeft",
  "newsletter",
  "flyer_zeitung",
  "sonstiges",
] as const

export type OrderSource = (typeof ORDER_SOURCES)[number]

type SaveOrderSourceWorkflowInput = {
  order_id: string
  source: OrderSource
  // Free text, only for "sonstiges"
  text?: string
}

// Keeps the answer on the order (metadata hdyhau, hdyhau_text, hdyhau_at) for
// the marketing reports: buyers who declined cookies are invisible to Meta and
// Google, but not to this question.
// Same update as clear-meta-attribution: metadata merges, an empty string
// deletes the key, and no order change is recorded.
export const saveOrderSourceWorkflow = createWorkflow(
  "save-order-source",
  function (input: SaveOrderSourceWorkflowInput) {
    const orderUpdate = transform({ input }, ({ input }) => ({
      selector: { id: input.order_id },
      update: {
        metadata: {
          hdyhau: input.source,
          hdyhau_text: input.text ?? "",
          hdyhau_at: new Date().toISOString(),
        },
      },
    }))
    updateOrdersStep(orderUpdate)

    return new WorkflowResponse(void 0)
  }
)

export default saveOrderSourceWorkflow
