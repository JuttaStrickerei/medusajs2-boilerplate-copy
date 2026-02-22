import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const AdminListSendcloudShipmentsParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(
  z.object({
    q: z.string().optional(),
    order_id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    is_return: z.preprocess(
      (val) => {
        if (val === "true") return true
        if (val === "false") return false
        return val
      },
      z.boolean().optional()
    ),
    carrier: z.string().optional(),
  })
)

export type AdminListSendcloudShipmentsParamsType = z.infer<
  typeof AdminListSendcloudShipmentsParams
>

export const AdminCreateSendcloudShipmentBody = z.object({
  order_id: z.string().min(1),
  sendcloud_id: z.string().optional(),
  tracking_number: z.string().optional(),
  tracking_url: z.string().optional(),
  carrier: z.string().optional(),
  status: z.string().optional(),
  is_return: z.boolean().optional(),
  weight: z.number().positive().optional(),
  recipient_name: z.string().min(1),
  recipient_company: z.string().optional(),
  recipient_address: z.string().min(1),
  recipient_house_number: z.string().min(1),
  recipient_city: z.string().min(1),
  recipient_postal_code: z.string().min(1),
  recipient_country: z.string().length(2),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
  sendcloud_response: z.record(z.unknown()).optional(),
  label_url: z.string().optional(),
})

export type AdminCreateSendcloudShipmentBodyType = z.infer<
  typeof AdminCreateSendcloudShipmentBody
>

export const AdminUpdateSendcloudShipmentBody = z.object({
  status: z.string().optional(),
  tracking_number: z.string().optional(),
  tracking_url: z.string().optional(),
  carrier: z.string().optional(),
  sendcloud_response: z.record(z.unknown()).optional(),
  error_message: z.string().nullable().optional(),
  label_url: z.string().nullable().optional(),
})

export type AdminUpdateSendcloudShipmentBodyType = z.infer<
  typeof AdminUpdateSendcloudShipmentBody
>
