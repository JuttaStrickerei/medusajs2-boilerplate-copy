import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { LOOK_MODULE } from "../modules/look"
import { createLookStep, CreateLookStepInput } from "./steps/create-look"
import { createLookItemsStep } from "./steps/create-look-items"

export type CreateLookWorkflowInput = CreateLookStepInput & {
  product_ids: string[]
}

export const createLookWorkflow = createWorkflow(
  "create-look",
  function (input: CreateLookWorkflowInput) {
    const lookData = transform({ input }, ({ input }) => {
      const { product_ids, ...data } = input
      return data
    })

    const look = createLookStep(lookData)

    const items = createLookItemsStep(
      transform({ look, input }, ({ look, input }) => ({
        look_id: look.id,
        product_ids: input.product_ids,
      }))
    )

    createRemoteLinkStep(
      transform({ items }, ({ items }) =>
        items.map((item) => ({
          [LOOK_MODULE]: { look_item_id: item.id },
          [Modules.PRODUCT]: { product_id: item.product_id },
        }))
      )
    )

    return new WorkflowResponse(look)
  }
)
