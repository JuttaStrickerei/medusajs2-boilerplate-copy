import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateOrdersStep } from "@medusajs/medusa/core-flows"

type SavePaymentMethodLabelInput = {
  order_id: string
  label: string
  type: string
}

// Merkt sich die tatsächlich genutzte Zahlungsart an der Bestellung, damit
// Bestellseite, Mails und Rechnung Stripe nicht jedes Mal fragen müssen.
// Wie clear-meta-attribution: updateOrdersStep statt updateOrderWorkflow (der
// legt eine Bestelländerung an). Metadaten werden zusammengeführt.
export const savePaymentMethodLabelWorkflow = createWorkflow(
  "save-payment-method-label",
  function (input: SavePaymentMethodLabelInput) {
    const orderUpdate = transform({ input }, ({ input }) => ({
      selector: { id: input.order_id },
      update: {
        metadata: {
          payment_method_label: input.label,
          payment_method_type: input.type,
        },
      },
    }))
    updateOrdersStep(orderUpdate)

    return new WorkflowResponse(void 0)
  }
)

export default savePaymentMethodLabelWorkflow
