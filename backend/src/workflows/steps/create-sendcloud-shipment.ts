import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SENDCLOUD_SHIPMENT_MODULE } from "../../modules/sendcloud-shipment"
import SendcloudShipmentModuleService from "../../modules/sendcloud-shipment/service"

type CreateSendcloudShipmentInput = {
  order_id: string
  sendcloud_id?: string
  tracking_number?: string
  tracking_url?: string
  carrier?: string
  service_point_id?: string
  service_point_name?: string
  service_point_address?: string
  status?: string
  is_return?: boolean
  weight?: number
  recipient_name: string
  recipient_company?: string
  recipient_address: string
  recipient_house_number: string
  recipient_city: string
  recipient_postal_code: string
  recipient_country: string
  recipient_email?: string
  recipient_phone?: string
  sendcloud_response?: Record<string, unknown>
  label_url?: string
}

export const createSendcloudShipmentStep = createStep(
  "create-sendcloud-shipment-record",
  async (input: CreateSendcloudShipmentInput, { container }) => {
    const sendcloudShipmentService = container.resolve<SendcloudShipmentModuleService>(SENDCLOUD_SHIPMENT_MODULE)

    const shipment = await sendcloudShipmentService.createSendcloudShipments({
      order_id: input.order_id,
      sendcloud_id: input.sendcloud_id ?? null,
      tracking_number: input.tracking_number ?? null,
      tracking_url: input.tracking_url ?? null,
      carrier: input.carrier ?? null,
      service_point_id: input.service_point_id ?? null,
      service_point_name: input.service_point_name ?? null,
      service_point_address: input.service_point_address ?? null,
      status: input.status ?? "created",
      is_return: input.is_return ?? false,
      weight: input.weight ?? null,
      recipient_name: input.recipient_name,
      recipient_company: input.recipient_company ?? null,
      recipient_address: input.recipient_address,
      recipient_house_number: input.recipient_house_number,
      recipient_city: input.recipient_city,
      recipient_postal_code: input.recipient_postal_code,
      recipient_country: input.recipient_country,
      recipient_email: input.recipient_email ?? null,
      recipient_phone: input.recipient_phone ?? null,
      sendcloud_response: input.sendcloud_response ?? null,
      label_url: input.label_url ?? null,
    })

    return new StepResponse(shipment, shipment.id)
  },
  async (shipmentId, { container }) => {
    if (!shipmentId) return

    const sendcloudShipmentService = container.resolve<SendcloudShipmentModuleService>(SENDCLOUD_SHIPMENT_MODULE)

    await sendcloudShipmentService.deleteSendcloudShipments(shipmentId)
  }
)

export type { CreateSendcloudShipmentInput }
