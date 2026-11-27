import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { resolveOrderPaymentMethod } from "../lib/order-payment-method"

/**
 * Speichert nach jeder Bestellung die tatsächlich genutzte Zahlungsart
 * (Apple Pay, Google Pay, Kreditkarte …) in order.metadata. Die
 * Bestellbestätigung im Shop liest sie von dort; ist dieser Subscriber noch
 * nicht durch, ermittelt die Store-Route sie selbst (GET
 * /store/orders/:id/payment-method).
 */
export default async function paymentMethodLabelHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await resolveOrderPaymentMethod(container, data.id)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
