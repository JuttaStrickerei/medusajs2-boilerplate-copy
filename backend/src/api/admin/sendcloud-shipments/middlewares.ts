import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  AdminListSendcloudShipmentsParams,
  AdminCreateSendcloudShipmentBody,
  AdminUpdateSendcloudShipmentBody,
} from "./validators"

const sendcloudShipmentDefaults = [
  "id",
  "order_id",
  "sendcloud_id",
  "tracking_number",
  "tracking_url",
  "carrier",
  "service_point_id",
  "service_point_name",
  "status",
  "is_return",
  "weight",
  "recipient_name",
  "recipient_company",
  "recipient_city",
  "recipient_postal_code",
  "recipient_country",
  "error_message",
  "label_url",
  "shipped_at",
  "delivered_at",
  "created_at",
  "updated_at",
]

const sendcloudShipmentDetailDefaults = [
  ...sendcloudShipmentDefaults,
  "recipient_address",
  "recipient_house_number",
  "recipient_email",
  "recipient_phone",
  "service_point_address",
  "sendcloud_response",
  "retry_count",
  "length",
  "width",
  "height",
]

export const adminSendcloudShipmentMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/sendcloud-shipments",
    middlewares: [
      validateAndTransformQuery(AdminListSendcloudShipmentsParams, {
        defaults: sendcloudShipmentDefaults,
        isList: true,
        defaultLimit: 20,
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sendcloud-shipments",
    middlewares: [
      validateAndTransformBody(AdminCreateSendcloudShipmentBody),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/sendcloud-shipments/:id",
    middlewares: [
      validateAndTransformQuery(AdminListSendcloudShipmentsParams, {
        defaults: sendcloudShipmentDetailDefaults,
        isList: false,
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/sendcloud-shipments/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateSendcloudShipmentBody),
    ],
  },
]
