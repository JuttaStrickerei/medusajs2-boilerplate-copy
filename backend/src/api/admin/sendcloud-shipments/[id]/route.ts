import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SENDCLOUD_SHIPMENT_MODULE } from "../../../../modules/sendcloud-shipment"
import SendcloudShipmentModuleService from "../../../../modules/sendcloud-shipment/service"
import updateSendcloudShipmentWorkflow from "../../../../workflows/update-sendcloud-shipment"
import cancelSendcloudShipmentWorkflow from "../../../../workflows/cancel-sendcloud-shipment"
import type { AdminUpdateSendcloudShipmentBodyType } from "../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const service = req.scope.resolve<SendcloudShipmentModuleService>(SENDCLOUD_SHIPMENT_MODULE)

  try {
    const shipment = await service.retrieveSendcloudShipment(id)
    return res.json({ sendcloud_shipment: shipment })
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Sendcloud shipment with id ${id} not found`
    )
  }
}

export async function POST(
  req: MedusaRequest<AdminUpdateSendcloudShipmentBodyType>,
  res: MedusaResponse
) {
  const { id } = req.params

  const { result } = await updateSendcloudShipmentWorkflow(req.scope).run({
    input: {
      shipment_id: id,
      ...req.validatedBody,
    },
  })

  return res.json({ sendcloud_shipment: result })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  const { result } = await cancelSendcloudShipmentWorkflow(req.scope).run({
    input: { shipment_id: id },
  })

  return res.json({ sendcloud_shipment: result })
}
