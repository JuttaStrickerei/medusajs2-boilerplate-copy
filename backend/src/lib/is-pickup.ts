import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

// Codebase seed value is "pickup"; Medusa-canonical is "pick-up". Accept both.
function matchesPickupType(type: string | null | undefined): boolean {
  if (!type) return false
  const normalized = type.toLowerCase()
  return normalized === "pickup" || normalized === "pick-up"
}

/**
 * Determines whether a fulfillment belongs to a pickup option, by traversing
 * fulfillment → shipping_option → service_zone → fulfillment_set.type via
 * query.graph.
 *
 * Used in subscribers because the fulfillment's own `requires_shipping` field
 * is empirically unreliable in this codebase (see commit 313e0e9 for the same
 * bug fixed in the admin UI). query.graph stays inside the Fulfillment
 * Module's own graph so the traversal is supported (unlike /admin/orders
 * fields=, which crosses a read-only Cart→Fulfillment link).
 */
export async function isPickupFulfillment(
  container: MedusaContainer,
  fulfillmentId: string
): Promise<boolean> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "fulfillment",
    fields: ["id", "shipping_option.service_zone.fulfillment_set.type"],
    filters: { id: fulfillmentId },
  })
  const ff = data?.[0] as
    | {
        shipping_option?: {
          service_zone?: {
            fulfillment_set?: { type?: string | null } | null
          } | null
        } | null
      }
    | undefined
  return matchesPickupType(
    ff?.shipping_option?.service_zone?.fulfillment_set?.type
  )
}

/**
 * Determines whether an order was placed with a pickup shipping method.
 * Returns true only if EVERY shipping method on the order is a pickup option
 * (mixed-method orders are conservatively classified as delivery, matching
 * the admin UI's `isPickupOrder` semantics).
 */
export async function isPickupOrder(
  container: MedusaContainer,
  orderId: string
): Promise<boolean> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "shipping_methods.shipping_option.service_zone.fulfillment_set.type",
    ],
    filters: { id: orderId },
  })
  const order = data?.[0] as
    | {
        shipping_methods?: Array<{
          shipping_option?: {
            service_zone?: {
              fulfillment_set?: { type?: string | null } | null
            } | null
          } | null
        }> | null
      }
    | undefined
  const types = (order?.shipping_methods || [])
    .map((sm) => sm?.shipping_option?.service_zone?.fulfillment_set?.type)
    .filter((t): t is string => !!t)
  if (types.length === 0) return false
  return types.every(matchesPickupType)
}
