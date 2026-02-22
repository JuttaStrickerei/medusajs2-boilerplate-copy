/**
 * Data Migration Script: fulfillment.data → sendcloud_shipment table
 *
 * Extracts existing Sendcloud shipment data from Medusa fulfillments
 * and creates records in the new sendcloud_shipment table.
 *
 * Safe to run multiple times (idempotent via sendcloud_id check).
 *
 * Usage: npx ts-node src/scripts/migrate-sendcloud-shipments.ts
 * Or run via the Medusa dev server (scheduled job / loader).
 */
import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { SENDCLOUD_SHIPMENT_MODULE } from "../modules/sendcloud-shipment"

export default async function migrateSendcloudShipments({
  container,
}: ExecArgs) {
  const logger = container.resolve("logger")
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)
  const sendcloudShipmentService = container.resolve(SENDCLOUD_SHIPMENT_MODULE) as any
  const query = container.resolve("query")

  logger.info("[MigrateSC] Starting Sendcloud shipment data migration...")

  try {
    const allFulfillments = await fulfillmentService.listFulfillments(
      { provider_id: ["sendcloud_sendcloud"] },
      { relations: ["labels", "delivery_address"] }
    )

    logger.info(
      `[MigrateSC] Found ${allFulfillments.length} Sendcloud fulfillments to process`
    )

    let created = 0
    let skipped = 0
    let errors = 0

    for (const fulfillment of allFulfillments) {
      try {
        const data = (fulfillment.data || {}) as Record<string, any>
        const parcelId = data.parcel_id

        if (!parcelId) {
          logger.debug(
            `[MigrateSC] Skipping fulfillment ${fulfillment.id}: no parcel_id`
          )
          skipped++
          continue
        }

        const existing =
          await sendcloudShipmentService.listSendcloudShipments({
            sendcloud_id: String(parcelId),
          })

        if (existing.length > 0) {
          logger.debug(
            `[MigrateSC] Skipping parcel ${parcelId}: already migrated`
          )
          skipped++
          continue
        }

        let orderId = "unknown"
        try {
          const { data: fulfillmentOrders } = await query.graph({
            entity: "order",
            fields: ["id", "fulfillments.id"],
            filters: {},
          })
          const matchingOrder = fulfillmentOrders?.find((o: any) =>
            o.fulfillments?.some((f: any) => f.id === fulfillment.id)
          )
          if (matchingOrder) {
            orderId = matchingOrder.id
          }
        } catch {
          logger.warn(
            `[MigrateSC] Could not find order for fulfillment ${fulfillment.id}`
          )
        }

        const deliveryAddress =
          (fulfillment as any).delivery_address || {}
        const isReturn = data.is_return === true

        let status = "created"
        if (fulfillment.delivered_at) status = "delivered"
        else if (fulfillment.shipped_at) status = "announced"
        else if (fulfillment.canceled_at) status = "canceled"

        await sendcloudShipmentService.createSendcloudShipments({
          order_id: orderId,
          sendcloud_id: String(parcelId),
          tracking_number: data.tracking_number || null,
          tracking_url: data.tracking_url || null,
          carrier: data.carrier || null,
          status,
          is_return: isReturn,
          recipient_name:
            deliveryAddress.first_name && deliveryAddress.last_name
              ? `${deliveryAddress.first_name} ${deliveryAddress.last_name}`
              : "Unknown",
          recipient_company: deliveryAddress.company || null,
          recipient_address: deliveryAddress.address_1 || "Unknown",
          recipient_house_number: deliveryAddress.address_2 || "0",
          recipient_city: deliveryAddress.city || "Unknown",
          recipient_postal_code: deliveryAddress.postal_code || "00000",
          recipient_country:
            deliveryAddress.country_code?.toUpperCase() || "AT",
          recipient_email: null,
          recipient_phone: deliveryAddress.phone || null,
          sendcloud_response: data,
          label_url: data.label_url || null,
          shipped_at: fulfillment.shipped_at || null,
          delivered_at: fulfillment.delivered_at || null,
        })

        created++
        logger.info(
          `[MigrateSC] Created shipment for parcel ${parcelId} (order: ${orderId})`
        )
      } catch (err) {
        errors++
        logger.error(
          `[MigrateSC] Error migrating fulfillment ${fulfillment.id}: ${
            err instanceof Error ? err.message : String(err)
          }`
        )
      }
    }

    logger.info(
      `[MigrateSC] Migration complete: ${created} created, ${skipped} skipped, ${errors} errors`
    )
  } catch (err) {
    logger.error(
      `[MigrateSC] Migration failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
  }
}
