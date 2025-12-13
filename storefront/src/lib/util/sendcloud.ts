/**
 * Sendcloud URL utilities for tracking and returns portal
 */

// Get brand domain from environment (should be set in .env.local)
// Default to "strickerei-jutta" for Strickerei Jutta store
const SENDCLOUD_BRAND_DOMAIN = process.env.NEXT_PUBLIC_SENDCLOUD_BRAND_DOMAIN || "strickerei-jutta"

/**
 * Fulfillment data structure from Sendcloud provider
 */
export type SendcloudFulfillmentData = {
  parcel_id?: number
  tracking_number?: string
  tracking_url?: string
  label_url?: string
  carrier?: string
  status?: string
  is_return?: boolean
}

/**
 * Get the branded returns portal URL for a customer
 * Format: https://{brand}.sendcloud.sc/returns/?postal_code={PLZ}&order_number={order_number}
 */
export function getReturnsPortalUrl(
  postalCode: string,
  orderNumber: string | number
): string {
  const encodedPostalCode = encodeURIComponent(postalCode || "")
  const encodedOrderNumber = encodeURIComponent(String(orderNumber || ""))

  return `https://${SENDCLOUD_BRAND_DOMAIN}.sendcloud.sc/returns/?postal_code=${encodedPostalCode}&order_number=${encodedOrderNumber}`
}

/**
 * Get the branded tracking page URL
 * Uses the tracking_url from the fulfillment data (already branded by Sendcloud)
 */
export function getTrackingUrl(fulfillmentData: SendcloudFulfillmentData | null): string | null {
  return fulfillmentData?.tracking_url || null
}

/**
 * Get tracking number from fulfillment data
 */
export function getTrackingNumber(fulfillmentData: SendcloudFulfillmentData | null): string | null {
  return fulfillmentData?.tracking_number || null
}

/**
 * Get carrier name from fulfillment data
 */
export function getCarrierName(fulfillmentData: SendcloudFulfillmentData | null): string | null {
  const carrier = fulfillmentData?.carrier
  if (!carrier) return null
  
  // Map common carrier codes to readable names
  const carrierNames: Record<string, string> = {
    "dhl": "DHL",
    "dpd": "DPD",
    "ups": "UPS",
    "gls": "GLS",
    "hermes": "Hermes",
    "dhl_express": "DHL Express",
    "post_at": "Österreichische Post",
    "postnl": "PostNL",
    "colissimo": "Colissimo",
    "chronopost": "Chronopost",
  }
  
  return carrierNames[carrier.toLowerCase()] || carrier.toUpperCase()
}

/**
 * Check if a fulfillment has been shipped
 */
export function isFulfillmentShipped(fulfillment: {
  shipped_at?: Date | string | null
  data?: Record<string, unknown> | null
}): boolean {
  return !!fulfillment.shipped_at || !!((fulfillment.data as SendcloudFulfillmentData)?.tracking_number)
}

/**
 * Check if a fulfillment has been delivered
 */
export function isFulfillmentDelivered(fulfillment: {
  delivered_at?: Date | string | null
}): boolean {
  return !!fulfillment.delivered_at
}

/**
 * Get the status of a fulfillment
 */
export function getFulfillmentStatus(fulfillment: {
  shipped_at?: Date | string | null
  delivered_at?: Date | string | null
  canceled_at?: Date | string | null
  data?: Record<string, unknown> | null
}): "pending" | "shipped" | "delivered" | "canceled" {
  if (fulfillment.canceled_at) return "canceled"
  if (fulfillment.delivered_at) return "delivered"
  if (fulfillment.shipped_at || ((fulfillment.data as SendcloudFulfillmentData)?.tracking_number)) return "shipped"
  return "pending"
}

/**
 * Get a human-readable status label
 */
export function getFulfillmentStatusLabel(status: "pending" | "shipped" | "delivered" | "canceled"): string {
  const labels: Record<string, string> = {
    pending: "In Bearbeitung",
    shipped: "Versendet",
    delivered: "Zugestellt",
    canceled: "Storniert",
  }
  return labels[status] || status
}

