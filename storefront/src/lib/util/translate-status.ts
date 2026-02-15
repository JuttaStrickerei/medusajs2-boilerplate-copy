// FIX: Centralized German translations for payment and fulfillment status strings.
// Used across order-details, order-card, and any future component that displays order status.

const PAYMENT_STATUS_DE: Record<string, string> = {
  not_paid: "Nicht bezahlt",
  awaiting: "Ausstehend",
  authorized: "Autorisiert",
  captured: "Bezahlt",
  partially_captured: "Teilweise bezahlt",
  partially_refunded: "Teilweise erstattet",
  refunded: "Erstattet",
  canceled: "Storniert",
  requires_action: "Aktion erforderlich",
  pending: "Ausstehend",
}

const FULFILLMENT_STATUS_DE: Record<string, string> = {
  not_fulfilled: "In Bearbeitung",
  partially_fulfilled: "Teilweise versendet",
  fulfilled: "Versendet",
  partially_shipped: "Teilweise versendet",
  shipped: "Versendet",
  partially_delivered: "Teilweise geliefert",
  delivered: "Geliefert",
  partially_returned: "Teilweise retourniert",
  returned: "Retourniert",
  canceled: "Storniert",
}

/**
 * Translate a payment status string to German.
 * Falls back to the original string if no translation is found.
 */
export function translatePaymentStatus(status: string): string {
  return PAYMENT_STATUS_DE[status.toLowerCase()] || status
}

/**
 * Translate a fulfillment status string to German.
 * Falls back to the original string if no translation is found.
 */
export function translateFulfillmentStatus(status: string): string {
  return FULFILLMENT_STATUS_DE[status.toLowerCase()] || status
}
