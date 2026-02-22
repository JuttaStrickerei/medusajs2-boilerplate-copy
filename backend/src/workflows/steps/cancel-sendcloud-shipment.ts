import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SENDCLOUD_SHIPMENT_MODULE } from "../../modules/sendcloud-shipment"
import SendcloudShipmentModuleService from "../../modules/sendcloud-shipment/service"

type CancelSendcloudShipmentInput = {
  shipment_id: string
}

export const cancelSendcloudShipmentStep = createStep(
  "cancel-sendcloud-shipment-record",
  async (input: CancelSendcloudShipmentInput, { container }) => {
    const service = container.resolve<SendcloudShipmentModuleService>(SENDCLOUD_SHIPMENT_MODULE)
    const existing = await service.retrieveSendcloudShipment(input.shipment_id)
    const previousStatus = existing.status

    await service.updateSendcloudShipments({
      id: input.shipment_id,
      status: "canceled",
    })

    return new StepResponse(
      { id: input.shipment_id, status: "canceled" },
      { shipment_id: input.shipment_id, previous_status: previousStatus }
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData?.shipment_id) return
    const service = container.resolve<SendcloudShipmentModuleService>(SENDCLOUD_SHIPMENT_MODULE)
    await service.updateSendcloudShipments({
      id: compensationData.shipment_id,
      status: compensationData.previous_status,
    })
  }
)

export type { CancelSendcloudShipmentInput }
