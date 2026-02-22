import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SENDCLOUD_SHIPMENT_MODULE } from "../../../modules/sendcloud-shipment"
import SendcloudShipmentModuleService from "../../../modules/sendcloud-shipment/service"
import createSendcloudShipmentWorkflow from "../../../workflows/create-sendcloud-shipment"
import type { AdminCreateSendcloudShipmentBodyType } from "./validators"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const service = req.scope.resolve<SendcloudShipmentModuleService>(SENDCLOUD_SHIPMENT_MODULE)

  const filters: Record<string, unknown> = {}
  const query = req.query as Record<string, unknown>

  if (query.order_id) filters.order_id = query.order_id
  if (query.status) filters.status = query.status
  if (query.is_return !== undefined) filters.is_return = query.is_return === "true"
  if (query.carrier) filters.carrier = query.carrier

  const limit = Number(query.limit) || 20
  const offset = Number(query.offset) || 0

  const [shipments, count] =
    await service.listAndCountSendcloudShipments(filters, {
      skip: offset,
      take: limit,
      order: { created_at: "DESC" },
    })

  return res.json({
    sendcloud_shipments: shipments,
    count,
    offset,
    limit,
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
