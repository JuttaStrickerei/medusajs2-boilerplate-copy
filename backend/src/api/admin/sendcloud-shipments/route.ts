import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SENDCLOUD_SHIPMENT_MODULE } from "../../../modules/sendcloud-shipment"
import SendcloudShipmentModuleService from "../../../modules/sendcloud-shipment/service"
import createSendcloudShipmentWorkflow from "../../../workflows/create-sendcloud-shipment"
import type {
  AdminListSendcloudShipmentsParamsType,
  AdminCreateSendcloudShipmentBodyType,
} from "./validators"

export async function GET(
  req: MedusaRequest<AdminListSendcloudShipmentsParamsType>,
  res: MedusaResponse
) {
  const sendcloudShipmentService = req.scope.resolve<SendcloudShipmentModuleService>(SENDCLOUD_SHIPMENT_MODULE)

  const filters: Record<string, unknown> = {}
  const validated = req.validatedQuery as Record<string, unknown> | undefined

  if (validated?.order_id) filters.order_id = validated.order_id
  if (validated?.status) filters.status = validated.status
  if (validated?.is_return !== undefined) filters.is_return = validated.is_return
  if (validated?.carrier) filters.carrier = validated.carrier

  const pagination = req.queryConfig?.pagination || { skip: 0, take: 20 }

  const [shipments, count] =
    await sendcloudShipmentService.listAndCountSendcloudShipments(filters, {
      select: req.queryConfig?.fields,
      skip: pagination.skip,
      take: pagination.take,
      order: { created_at: "DESC" },
    })

  return res.json({
    sendcloud_shipments: shipments,
    count,
    offset: pagination.skip,
    limit: pagination.take,
  })
}

export async function POST(
  req: MedusaRequest<AdminCreateSendcloudShipmentBodyType>,
  res: MedusaResponse
) {
  const body = req.validatedBody as AdminCreateSendcloudShipmentBodyType

  const { result } = await createSendcloudShipmentWorkflow(req.scope).run({
    input: {
      order_id: body.order_id,
      sendcloud_id: body.sendcloud_id,
      tracking_number: body.tracking_number,
      tracking_url: body.tracking_url,
      carrier: body.carrier,
      status: body.status,
      is_return: body.is_return,
      weight: body.weight,
      recipient_name: body.recipient_name,
      recipient_company: body.recipient_company,
      recipient_address: body.recipient_address,
      recipient_house_number: body.recipient_house_number,
      recipient_city: body.recipient_city,
      recipient_postal_code: body.recipient_postal_code,
      recipient_country: body.recipient_country,
      recipient_email: body.recipient_email,
      recipient_phone: body.recipient_phone,
      sendcloud_response: body.sendcloud_response,
      label_url: body.label_url,
    },
  })

  return res.status(201).json({ sendcloud_shipment: result })
}
