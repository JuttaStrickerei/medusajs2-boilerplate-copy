import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { STRIPE_API_KEY } from "../lib/constants"
import {
  fetchStripePaymentMethod,
  type PaymentMethodInfo,
} from "../lib/stripe-payment-method"

const STRIPE_PROVIDER_ID = "pp_stripe_stripe"

type GetOrderPaymentMethodInput = {
  order_id: string
}

/**
 * Fragt Stripe nach der tatsächlich genutzten Zahlungsart. Nur lesend: kein
 * Rückgängigmachen nötig, nichts wird gespeichert.
 */
const fetchStripePaymentMethodStep = createStep(
  "fetch-stripe-payment-method",
  async (input: { intent_id: string | null }) => {
    if (!input.intent_id || !STRIPE_API_KEY) {
      return new StepResponse<PaymentMethodInfo | null>(null)
    }
    const info = await fetchStripePaymentMethod(input.intent_id, STRIPE_API_KEY)
    return new StepResponse<PaymentMethodInfo | null>(info)
  }
)

/**
 * Tatsächlich genutzte Zahlungsart einer Bestellung („Apple Pay“,
 * „Kreditkarte (Visa •••• 4242)“, „PayPal“ …) für die Bestellbestätigung.
 *
 * Medusa speichert am Payment nur den PaymentIntent; Apple Pay und Google Pay
 * laufen dort als „card“. Welche Art es war, steht nur an der Charge bei
 * Stripe. Bewusst nur lesend und ohne Speichern: So gibt es keinen zweiten
 * Schreiber auf order.metadata neben dem Meta-Subscriber (meta-capi-purchase).
 */
export const getOrderPaymentMethodWorkflow = createWorkflow(
  "get-order-payment-method",
  function (input: GetOrderPaymentMethodInput) {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "payment_collections.payments.provider_id",
        "payment_collections.payments.data",
      ],
      filters: { id: input.order_id },
    })

    const intentId = transform({ orders }, ({ orders }) => {
      const payment = (orders?.[0]?.payment_collections ?? [])
        .flatMap((collection: any) => collection?.payments ?? [])
        .find((p: any) => p?.provider_id === STRIPE_PROVIDER_ID)
      const id = (payment?.data as Record<string, unknown> | undefined)?.id
      return { intent_id: typeof id === "string" ? id : null }
    })

    const info = fetchStripePaymentMethodStep(intentId)

    return new WorkflowResponse(info)
  }
)

export default getOrderPaymentMethodWorkflow
