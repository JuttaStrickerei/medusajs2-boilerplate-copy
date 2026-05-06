import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

// Codebase seed value is "pickup"; Medusa-canonical is "pick-up". Accept both.
function matchesPickupType(type: string | null | undefined): boolean {
  if (!type) return false
  const normalized = type.toLowerCase()
  return normalized === "pickup" || normalized === "pick-up"
}

/**
 * Pre-fetches the IDs of all shipping options whose service_zone's
 * fulfillment_set is of pickup type. Used by `isPickupOrder` because
 * the Order Module's `OrderShippingMethod` data model has NO defined
 * relation to `ShippingOption` — only a scalar `shipping_option_id`.
 * The Cart Module's `ShippingMethod` has the read-only link, but the
 * order's shipping methods are a different entity.
 *
 * The shipping_option entity lives in the Fulfillment Module, so the
 * deeper `service_zone.fulfillment_set.type` traversal is fully
 * supported (in-module).
 *
 * Fault-tolerant: returns an empty Set on any error, which makes
 * the caller default to "delivery" classification. The customer's
 * order confirmation email is more important than the pickup vs.
 * delivery branching.
 */
async function getPickupOptionIds(
  container: MedusaContainer
): Promise<Set<string>> {
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "shipping_option",
      fields: ["id", "service_zone.fulfillment_set.type"],
    })
    const ids = new Set<string>()
    for (const opt of (data || []) as Array<{
      id: string
      service_zone?: { fulfillment_set?: { type?: string | null } | null } | null
    }>) {
      if (matchesPickupType(opt?.service_zone?.fulfillment_set?.type)) {
        ids.add(opt.id)
      }
    }
    return ids
  } catch {
    return new Set()
  }
}

/**
 * Determines whether a fulfillment belongs to a pickup option.
 *
 * Uses the in-Fulfillment-Module relation `fulfillment.shipping_option`
 * (BelongsTo<ShippingOption>) which is fully supported in query.graph.
 * Empirically this works in production for the codebase's setup.
 *
 * Wrapped in try/catch so any unexpected query.graph failure degrades
 * to "not pickup" rather than throwing out and breaking the subscriber's
 * email pipeline.
 */
export async function isPickupFulfillment(
  container: MedusaContainer,
  fulfillmentId: string
): Promise<boolean> {
  try {
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
  } catch {
    return false
  }
}

/**
 * Determines whether an order was placed with a pickup shipping method.
 *
 * Uses a SHALLOW scalar query (`shipping_methods.shipping_option_id`)
 * cross-referenced against pre-fetched pickup option IDs. We do NOT
 * traverse `shipping_methods.shipping_option.*` because the Order
 * Module's `OrderShippingMethod` has no defined relation to
 * ShippingOption — that link only exists on the Cart Module's
 * `ShippingMethod`. Attempting that traversal makes query.graph throw
 * (which would break the order-placed email pipeline entirely).
 *
 * Returns true only if EVERY shipping method on the order is a pickup
 * option (mixed-method orders are conservatively classified as
 * delivery, matching the admin UI's `isPickupOrder` semantics).
 *
 * Fault-tolerant: returns false on any error.
 */
export async function isPickupOrder(
  container: MedusaContainer,
  orderId: string
): Promise<boolean> {
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "order",
      fields: ["id", "shipping_methods.shipping_option_id"],
      filters: { id: orderId },
    })
    const order = data?.[0] as
      | {
          shipping_methods?: Array<{
            shipping_option_id?: string | null
          }> | null
        }
      | undefined
    const optIds = (order?.shipping_methods || [])
      .map((sm) => sm?.shipping_option_id)
      .filter((id): id is string => !!id)
    if (optIds.length === 0) return false

    const pickupIds = await getPickupOptionIds(container)
    if (pickupIds.size === 0) return false
    return optIds.every((id) => pickupIds.has(id))
  } catch {
    return false
  }
}
