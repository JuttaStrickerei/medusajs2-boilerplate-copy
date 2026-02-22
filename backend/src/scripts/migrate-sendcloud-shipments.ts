/**
 * Data Migration: fulfillment.data -> sendcloud_shipment table
 *
 * Extracts existing Sendcloud shipment data from Medusa fulfillments
 * and creates records in the new sendcloud_shipment table.
 *
 * Safe to run multiple times (idempotent via sendcloud_id check).
 *
 * Usage: npx medusa exec src/scripts/migrate-sendcloud-shipments.ts
 */
import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { SENDCLOUD_SHIPMENT_MODULE } from "../modules/sendcloud-shipment"

export default async function migrateSendcloudShipments({
  container,
}: ExecArgs) {
  const logger = container.resolve("logger")
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)
  const shipmentService = container.resolve(SENDCLOUD_SHIPMENT_MODULE) as any
  const query = container.resolve("query")

  logger.info("[MigrateSC] Starting Sendcloud shipment data migration...")

  try {
    const allFulfillments = await fulfillmentService.listFulfillments(
      { provider_id: ["sendcloud_sendcloud"] },
      { relations: ["labels", "delivery_address"] }
    )

    logger.info(`[MigrateSC] Found ${allFulfillments.length} Sendcloud fulfillments`)

    let created = 0
    let skipped = 0
    let errors = 0

    for (const fulfillment of allFulfillments) {
      try {
        const data = (fulfillment.data || {}) as Record<string, any>
        const parcelId = data.parcel_id

        if (!parcelId) {
          skipped++
          continue
        }

        const existing = await shipmentService.listSendcloudShipments({
          sendcloud_id: String(parcelId),
        })

        if (existing.length > 0) {
          skipped++
          continue
        }

        let orderId = "unknown"
        try {
          const { data: orders } = await query.graph({
            entity: "order",
            fields: ["id", "fulfillments.id"],
            filters: {},
          })
          const match = orders?.find((o: any) =>
            o.fulfillments?.some((f: any) => f.id === fulfillment.id)
          )
          if (match) orderId = match.id
        } catch {
          logger.warn(`[MigrateSC] Could not find order for fulfillment ${fulfillment.id}`)
        }

        const addr = (fulfillment as any).delivery_address || {}
        const isReturn = data.is_return === true

        let status = "created"
        if (fulfillment.delivered_at) status = "delivered"
        else if (fulfillment.shipped_at) status = "announced"
        else if (fulfillment.canceled_at) status = "canceled"

        await shipmentService.createSendcloudShipments({
          order_id: orderId,
          sendcloud_id: String(parcelId),
          tracking_number: data.tracking_number || null,
          tracking_url: data.tracking_url || null,
          carrier: data.carrier || null,
          status,
          is_return: isReturn,
          recipient_name:
            addr.first_name && addr.last_name
              ? `${addr.first_name} ${addr.last_name}`
              : "Unknown",
          recipient_company: addr.company || null,
          recipient_address: addr.address_1 || "Unknown",
          recipient_house_number: addr.address_2 || "0",
          recipient_city: addr.city || "Unknown",
          recipient_postal_code: addr.postal_code || "00000",
          recipient_country: addr.country_code?.toUpperCase() || "AT",
          sendcloud_response: data,
          label_url: data.label_url || null,
          shipped_at: fulfillment.shipped_at || null,
          delivered_at: fulfillment.delivered_at || null,
        })

        created++
        logger.info(`[MigrateSC] Created shipment for parcel ${parcelId}`)
      } catch (err) {
        errors++
        logger.error(`[MigrateSC] Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    logger.info(`[MigrateSC] Done: ${created} created, ${skipped} skipped, ${errors} errors`)
  } catch (err) {
    logger.error(`[MigrateSC] Failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}
