import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  cancelSendcloudShipmentStep,
  CancelSendcloudShipmentInput,
} from "./steps/cancel-sendcloud-shipment"

type WorkflowInput = CancelSendcloudShipmentInput

const cancelSendcloudShipmentWorkflow = createWorkflow(
  "cancel-sendcloud-shipment",
  function (input: WorkflowInput) {
    const result = cancelSendcloudShipmentStep(input)

    return new WorkflowResponse(result)
  }
)

export default cancelSendcloudShipmentWorkflow
