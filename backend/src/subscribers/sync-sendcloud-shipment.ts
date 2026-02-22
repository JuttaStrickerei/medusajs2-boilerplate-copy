import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import { SENDCLOUD_SHIPMENT_MODULE } from "../modules/sendcloud-shipment"

/**
 * Syncs Sendcloud fulfillment data into the sendcloud_shipment table.
 *
 * Triggered on shipment.created -- runs AFTER the fulfillment provider
 * has created the parcel in Sendcloud and returned the data.
 * Only processes Sendcloud fulfillments (checks provider_id).
 * Idempotent: skips if a record for this parcel_id already exists.
 */
export default async function syncSendcloudShipment({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  let logger: Logger
  try {
    logger = container.resolve("logger") as Logger
  } catch {
    logger = console as any
  }

  const fulfillmentId = data.id
  logger.info(`[SyncSCShipment] Processing fulfillment: ${fulfillmentId}`)

  try {
    const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any
    const shipmentService = container.resolve(SENDCLOUD_SHIPMENT_MODULE) as any
    const query = container.resolve("query") as any

    const fulfillment = await fulfillmentService.retrieveFulfillment(fulfillmentId, {
      relations: ["labels", "delivery_address"],
    })

    if (!fulfillment?.provider_id?.includes("sendcloud")) {
      logger.info(`[SyncSCShipment] Not a Sendcloud fulfillment, skipping: ${fulfillment?.provider_id}`)
      return
    }

    const ffData = (fulfillment.data || {}) as Record<string, any>
    const parcelId = ffData.parcel_id

    if (!parcelId) {
      logger.warn(`[SyncSCShipment] No parcel_id in fulfillment data, skipping`)
      return
    }

    const existing = await shipmentService.listSendcloudShipments({
      sendcloud_id: String(parcelId),
    })

    if (existing.length > 0) {
      logger.info(`[SyncSCShipment] Record already exists for parcel ${parcelId}, skipping`)
      return
    }

    let orderId = "unknown"
    try {
      const { data: orderFulfillments } = await query.graph({
        entity: "order_fulfillment",
        fields: ["order_id", "fulfillment_id"],
        filters: { fulfillment_id: fulfillmentId },
      })
      if (orderFulfillments?.[0]?.order_id) {
        orderId = orderFulfillments[0].order_id
      }
    } catch (err) {
      logger.warn(`[SyncSCShipment] Could not resolve order_id: ${err instanceof Error ? err.message : String(err)}`)
    }

    const addr = fulfillment.delivery_address || {}
    const isReturn = ffData.is_return === true
    const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

    await shipmentService.createSendcloudShipments({
      order_id: orderId,
      sendcloud_id: String(parcelId),
      tracking_number: ffData.tracking_number || null,
      tracking_url: ffData.tracking_url || null,
      carrier: ffData.carrier || null,
      status: isReturn ? "created" : "announced",
      is_return: isReturn,
      recipient_name:
        addr.first_name && addr.last_name
          ? `${addr.first_name} ${addr.last_name}`.trim()
          : addr.company || "Unknown",
      recipient_company: addr.company || null,
      recipient_address: addr.address_1 || "Unknown",
      recipient_house_number: addr.address_2 || "0",
      recipient_city: addr.city || "Unknown",
      recipient_postal_code: addr.postal_code || "00000",
      recipient_country: addr.country_code?.toUpperCase() || "AT",
      recipient_email: null,
      recipient_phone: addr.phone || null,
      sendcloud_response: ffData,
      label_url: ffData.label_url || `${backendUrl}/labels/${parcelId}`,
    })

    logger.info(`[SyncSCShipment] Created shipment record for parcel ${parcelId} (order: ${orderId})`)
  } catch (err) {
    logger.error(`[SyncSCShipment] Error: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
