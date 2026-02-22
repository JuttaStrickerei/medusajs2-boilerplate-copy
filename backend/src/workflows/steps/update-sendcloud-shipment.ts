import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SENDCLOUD_SHIPMENT_MODULE } from "../../modules/sendcloud-shipment"
import SendcloudShipmentModuleService from "../../modules/sendcloud-shipment/service"

type UpdateSendcloudShipmentInput = {
  shipment_id: string
  status?: string
  tracking_number?: string
  tracking_url?: string
  carrier?: string
  sendcloud_response?: Record<string, unknown>
  error_message?: string
  label_url?: string
  shipped_at?: Date
  delivered_at?: Date
}

export const updateSendcloudShipmentStep = createStep(
  "update-sendcloud-shipment-record",
  async (input: UpdateSendcloudShipmentInput, { container }) => {
    const service = container.resolve<SendcloudShipmentModuleService>(SENDCLOUD_SHIPMENT_MODULE)

    const existing = await service.retrieveSendcloudShipment(input.shipment_id)

    const previousData = {
      shipment_id: existing.id,
      status: existing.status,
      tracking_number: existing.tracking_number,
      tracking_url: existing.tracking_url,
      carrier: existing.carrier,
      label_url: existing.label_url,
      shipped_at: existing.shipped_at,
      delivered_at: existing.delivered_at,
    }

    const updateData: Record<string, unknown> = { id: input.shipment_id }
    if (input.status !== undefined) updateData.status = input.status
    if (input.tracking_number !== undefined) updateData.tracking_number = input.tracking_number
    if (input.tracking_url !== undefined) updateData.tracking_url = input.tracking_url
    if (input.carrier !== undefined) updateData.carrier = input.carrier
    if (input.sendcloud_response !== undefined) updateData.sendcloud_response = input.sendcloud_response
    if (input.error_message !== undefined) updateData.error_message = input.error_message
    if (input.label_url !== undefined) updateData.label_url = input.label_url
    if (input.shipped_at !== undefined) updateData.shipped_at = input.shipped_at
    if (input.delivered_at !== undefined) updateData.delivered_at = input.delivered_at

    const updated = await service.updateSendcloudShipments(updateData)

    return new StepResponse(updated, previousData)
  },
  async (previousData, { container }) => {
    if (!previousData?.shipment_id) return
    const service = container.resolve<SendcloudShipmentModuleService>(SENDCLOUD_SHIPMENT_MODULE)
    await service.updateSendcloudShipments({
      id: previousData.shipment_id,
      status: previousData.status,
      tracking_number: previousData.tracking_number,
      tracking_url: previousData.tracking_url,
      carrier: previousData.carrier,
      label_url: previousData.label_url,
      shipped_at: previousData.shipped_at,
      delivered_at: previousData.delivered_at,
    })
  }
)

export type { UpdateSendcloudShipmentInput }
