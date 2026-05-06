// Centralized pickup-related constants and labels for customer-facing emails.
// Single source of truth — update the shop address or the carrier label here
// and every transactional email picks it up automatically.
//
// TODO(jutta): When opening hours are confirmed by the merchant, add an
// OPENING_HOURS constant here and surface it in pickup templates next to the
// pickup location.

export const PICKUP_LOCATION =
  "Strickerei Jutta\nWr. Neustädterstraße 47\n7021 Gemeinde Draßburg\nÖsterreich"

export type FulfillmentType = "pickup" | "delivery"

// User-facing labels rendered as "Versandart: ..." in customer emails and in
// the admin order notification. Keep carrier name in sync with the carriers
// configured in medusa-config.js — this codebase only ships DPD via Sendcloud,
// so generalize this when a second carrier is added.
export const FULFILLMENT_TYPE_LABEL: Record<FulfillmentType, string> = {
  pickup: "Abholung im Shop",
  delivery: "Lieferung per DPD",
}
