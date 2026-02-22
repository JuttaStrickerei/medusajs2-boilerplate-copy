import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createSendcloudShipmentStep,
  CreateSendcloudShipmentInput,
} from "./steps/create-sendcloud-shipment"

type WorkflowInput = CreateSendcloudShipmentInput

const createSendcloudShipmentWorkflow = createWorkflow(
  "create-sendcloud-shipment",
  function (input: WorkflowInput) {
    const shipment = createSendcloudShipmentStep(input)
    return new WorkflowResponse(shipment)
  }
)

export default createSendcloudShipmentWorkflow
