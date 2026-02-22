import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createSendcloudShipmentStep,
  CreateSendcloudShipmentInput,
} from "./steps/create-sendcloud-shipment"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { transform } from "@medusajs/framework/workflows-sdk"
import { SENDCLOUD_SHIPMENT_MODULE } from "../modules/sendcloud-shipment"

type WorkflowInput = CreateSendcloudShipmentInput

const createSendcloudShipmentWorkflow = createWorkflow(
  "create-sendcloud-shipment",
  function (input: WorkflowInput) {
    const shipment = createSendcloudShipmentStep(input)

    const linkData = transform({ shipment, input }, ({ shipment, input }) => [
      {
        [Modules.ORDER]: {
          order_id: input.order_id,
        },
        [SENDCLOUD_SHIPMENT_MODULE]: {
          sendcloud_shipment_id: shipment.id,
        },
      },
    ])

    createRemoteLinkStep(linkData)

    return new WorkflowResponse(shipment)
  }
)

export default createSendcloudShipmentWorkflow
