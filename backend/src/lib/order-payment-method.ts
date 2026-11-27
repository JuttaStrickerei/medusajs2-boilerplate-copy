import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { STRIPE_API_KEY } from "./constants"
import {
  fetchStripePaymentMethod,
  type PaymentMethodInfo,
} from "./stripe-payment-method"
import { savePaymentMethodLabelWorkflow } from "../workflows/save-payment-method-label"

const STRIPE_PROVIDER_ID = "pp_stripe_stripe"

/**
 * Zahlungsart einer Bestellung: aus order.metadata, sonst einmal bei Stripe
 * nachfragen und an der Bestellung speichern. null, wenn es keine
 * Stripe-Zahlung gibt oder Stripe (noch) keine Charge kennt. Wirft nie.
 */
export async function resolveOrderPaymentMethod(
  container: MedusaContainer,
  orderId: string
): Promise<PaymentMethodInfo | null> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "metadata",
        "payment_collections.payments.provider_id",
        "payment_collections.payments.data",
      ],
      filters: { id: orderId },
    })
    if (!order) {
      return null
    }

    const metadata = (order.metadata ?? {}) as Record<string, unknown>
    if (
      typeof metadata.payment_method_label === "string" &&
      metadata.payment_method_label
    ) {
      return {
        label: metadata.payment_method_label,
        type: String(metadata.payment_method_type ?? ""),
      }
    }

    if (!STRIPE_API_KEY) {
      return null
    }

    const payment = (order.payment_collections ?? [])
      .flatMap((collection) => collection?.payments ?? [])
      .find((p) => p?.provider_id === STRIPE_PROVIDER_ID)
    const intentId = (payment?.data as Record<string, unknown> | undefined)?.id
    if (typeof intentId !== "string") {
      return null
    }

    const info = await fetchStripePaymentMethod(intentId, STRIPE_API_KEY)
    if (!info) {
      return null
    }

    await savePaymentMethodLabelWorkflow(container).run({
      input: { order_id: order.id, label: info.label, type: info.type },
    })
    return info
  } catch (e) {
    logger.warn(
      `[PaymentMethodLabel] Zahlungsart für ${orderId} nicht ermittelt: ${
        (e as Error)?.message
      }`
    )
    return null
  }
}
