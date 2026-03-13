import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

type FulfillmentStatus =
  | "preparing"
  | "shipped"
  | "delivered"
  | "canceled"
  | "exception"
  | "returned"

function deriveFulfillmentStatus(ff: any): FulfillmentStatus {
  if (ff.canceled_at) return "canceled"
  if (ff.delivered_at) return "delivered"
  if (ff.shipped_at) return "shipped"

  const scStatus = ff.metadata?.sendcloud_status?.toLowerCase() || ""
  if (scStatus.includes("exception") || scStatus.includes("failed")) return "exception"
  if (scStatus.includes("return")) return "returned"

  return "preparing"
}

/**
 * GET /admin/sendcloud/dashboard/shipments
 *
 * Returns all Sendcloud fulfillments from Medusa's canonical fulfillment data,
 * enriched with order display information. This guarantees completeness
 * regardless of whether the sendcloud_shipment sync succeeded.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT)
  const query = req.scope.resolve("query") as any

  const limit = Number(req.query.limit) || 50
  const offset = Number(req.query.offset) || 0
  const statusFilter = req.query.status as string | undefined
  const typeFilter = req.query.is_return as string | undefined

  try {
    const allFulfillments = await fulfillmentService.listFulfillments(
      { provider_id: ["sendcloud_sendcloud"] },
      {
        relations: ["labels", "delivery_address"],
        order: { created_at: "DESC" },
      }
    )

    let orderIdMap: Record<string, { order_id: string; display_id: string | number }> = {}
    try {
      const { data: orderFulfillments } = await query.graph({
        entity: "order_fulfillment",
        fields: ["order_id", "fulfillment_id"],
        filters: {},
      })
      if (orderFulfillments?.length) {
        const orderIds = [...new Set(orderFulfillments.map((of: any) => of.order_id))]
        const { data: orders } = await query.graph({
          entity: "order",
          fields: ["id", "display_id"],
          filters: { id: orderIds },
        })
        const displayMap: Record<string, string | number> = {}
        for (const o of orders || []) {
          displayMap[o.id] = o.display_id ?? o.id
        }
        for (const of_ of orderFulfillments) {
          orderIdMap[of_.fulfillment_id] = {
            order_id: of_.order_id,
            display_id: displayMap[of_.order_id] ?? of_.order_id,
          }
        }
      }
    } catch {
      // best-effort — shipments still show with "unknown" order
    }

    let shipments = allFulfillments.map((ff: any) => {
      const ffData = (ff.data || {}) as Record<string, any>
      const orderInfo = orderIdMap[ff.id] || { order_id: "unknown", display_id: "?" }
      const addr = ff.delivery_address || {}
      const isReturn = ffData.is_return === true
      const parcelId = ffData.parcel_id ? Number(ffData.parcel_id) : null
      const status = deriveFulfillmentStatus(ff)

      return {
        fulfillment_id: ff.id,
        order_id: orderInfo.order_id,
        order_display_id: orderInfo.display_id,
        sendcloud_id: ffData.parcel_id ? String(ffData.parcel_id) : null,
        parcel_id: parcelId,
        tracking_number: ffData.tracking_number || ff.labels?.[0]?.tracking_number || null,
        tracking_url: ffData.tracking_url || ff.labels?.[0]?.tracking_url || null,
        carrier: ffData.carrier || ff.metadata?.sendcloud_carrier || null,
        status,
        sendcloud_status: ff.metadata?.sendcloud_status || null,
        is_return: isReturn,
        recipient_name:
          addr.first_name && addr.last_name
            ? `${addr.first_name} ${addr.last_name}`.trim()
            : addr.company || "Unbekannt",
        recipient_city: addr.city || "",
        recipient_postal_code: addr.postal_code || "",
        recipient_country: addr.country_code?.toUpperCase() || "",
        label_available: !!parcelId,
        shipped_at: ff.shipped_at?.toISOString?.() ?? ff.shipped_at ?? null,
        delivered_at: ff.delivered_at?.toISOString?.() ?? ff.delivered_at ?? null,
        canceled_at: ff.canceled_at?.toISOString?.() ?? ff.canceled_at ?? null,
        created_at: ff.created_at?.toISOString?.() ?? ff.created_at ?? new Date().toISOString(),
      }
    })

    if (statusFilter) {
      shipments = shipments.filter((s: any) => s.status === statusFilter)
    }
    if (typeFilter !== undefined) {
      const wantReturn = typeFilter === "true"
      shipments = shipments.filter((s: any) => s.is_return === wantReturn)
    }

    const count = shipments.length
    const paged = shipments.slice(offset, offset + limit)

    return res.json({
      shipments: paged,
      count,
      offset,
      limit,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ message: `Failed to load shipments: ${message}` })
  }
}
