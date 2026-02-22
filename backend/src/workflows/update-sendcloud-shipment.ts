import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  updateSendcloudShipmentStep,
  UpdateSendcloudShipmentInput,
} from "./steps/update-sendcloud-shipment"

type WorkflowInput = UpdateSendcloudShipmentInput

const updateSendcloudShipmentWorkflow = createWorkflow(
  "update-sendcloud-shipment",
  function (input: WorkflowInput) {
    const updated = updateSendcloudShipmentStep(input)

    return new WorkflowResponse(updated)
  }
)

export default updateSendcloudShipmentWorkflow
