import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import { SENDCLOUD_SHIPMENT_MODULE } from "../modules/sendcloud-shipment"

type FulfillmentCreatedPayload = {
  order_id: string
  fulfillment_id: string
  no_notification?: boolean
}

/**
 * Syncs Sendcloud fulfillment data into the sendcloud_shipment table.
 *
 * Triggered on order.fulfillment_created -- fires when a new fulfillment
 * is created (NOT when it's marked as shipped, which is shipment.created).
 * Only processes Sendcloud fulfillments (checks provider_id).
 * Idempotent: skips if a record for this parcel_id already exists.
 */
export default async function syncSendcloudShipment({
  event: { data },
  container,
}: SubscriberArgs<FulfillmentCreatedPayload>) {
  let logger: Logger
  try {
    logger = container.resolve("logger") as Logger
  } catch {
    logger = console as any
  }

  const fulfillmentId = data.fulfillment_id
  const orderId = data.order_id
  logger.info(`[SyncSCShipment] Processing fulfillment: ${fulfillmentId} for order: ${orderId}`)

  try {
    const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any
    const shipmentService = container.resolve(SENDCLOUD_SHIPMENT_MODULE) as any

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

    const addr = fulfillment.delivery_address || {}
    const isReturn = ffData.is_return === true

    const publicDomain = process.env.RAILWAY_PUBLIC_DOMAIN_VALUE
      || process.env.MEDUSA_BACKEND_URL
      || "http://localhost:9000"
    const backendUrl = publicDomain.startsWith("http") ? publicDomain : `https://${publicDomain}`

    const labelUrl = ffData.label_url
      || `${backendUrl}/labels/${parcelId}`

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
      label_url: labelUrl,
    })

    logger.info(`[SyncSCShipment] Created shipment record for parcel ${parcelId} (order: ${orderId})`)
  } catch (err) {
    logger.error(`[SyncSCShipment] Error: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
}
