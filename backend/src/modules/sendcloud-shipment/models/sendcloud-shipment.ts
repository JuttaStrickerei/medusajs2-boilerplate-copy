import { model } from "@medusajs/framework/utils"

export const SendcloudShipmentStatus = [
  "created",
  "pending",
  "announced",
  "en_route_to_sorting_center",
  "delivered_at_sorting_center",
  "sorted",
  "en_route",
  "delivered",
  "exception",
  "canceled",
  "returned",
  "unknown",
]

const SendcloudShipment = model.define("sendcloud_shipment", {
  id: model.id().primaryKey(),

  order_id: model.text(),

  sendcloud_id: model.text().nullable(),
  tracking_number: model.text().nullable(),
  tracking_url: model.text().nullable(),

  carrier: model.text().nullable(),
  service_point_id: model.text().nullable(),
  service_point_name: model.text().nullable(),
  service_point_address: model.text().nullable(),

  status: model
    .enum(SendcloudShipmentStatus)
    .default("created"),

  is_return: model.boolean().default(false),

  weight: model.float().nullable(),
  length: model.float().nullable(),
  width: model.float().nullable(),
  height: model.float().nullable(),

  recipient_name: model.text(),
  recipient_company: model.text().nullable(),
  recipient_address: model.text(),
  recipient_house_number: model.text(),
  recipient_city: model.text(),
  recipient_postal_code: model.text(),
  recipient_country: model.text(),
  recipient_email: model.text().nullable(),
  recipient_phone: model.text().nullable(),

  sendcloud_response: model.json().nullable(),

  error_message: model.text().nullable(),
  retry_count: model.number().default(0),

  label_url: model.text().nullable(),

  shipped_at: model.dateTime().nullable(),
  delivered_at: model.dateTime().nullable(),
})

export default SendcloudShipment
