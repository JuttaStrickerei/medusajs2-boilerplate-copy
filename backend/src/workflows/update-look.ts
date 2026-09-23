import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { LOOK_MODULE } from "../modules/look"
import { updateLookStep, UpdateLookStepInput } from "./steps/update-look"
import { createLookItemsStep } from "./steps/create-look-items"
import { deleteLookItemsStep } from "./steps/delete-look-items"
import { toLinks } from "./utils/look-links"

export type UpdateLookWorkflowInput = UpdateLookStepInput & {
  // Wenn gesetzt, ersetzt diese Liste alle Teile des Looks (in dieser Reihenfolge)
  product_ids?: string[]
}

export const updateLookWorkflow = createWorkflow(
  "update-look",
  function (input: UpdateLookWorkflowInput) {
    const lookData = transform({ input }, ({ input }) => {
      const { product_ids, ...data } = input
      return data
    })

    const look = updateLookStep(lookData)

    when({ input }, ({ input }) => Array.isArray(input.product_ids)).then(
      () => {
        const { data: existing } = useQueryGraphStep({
          entity: "look",
          fields: ["id", "items.id", "items.product_link.product_id"],
          filters: { id: input.id },
        })

        const oldItems = transform({ existing }, ({ existing }) =>
          (existing[0]?.items ?? []).filter(Boolean)
        )

        // Nur die Link-Zeilen entfernen – niemals die Produkte selbst
        dismissRemoteLinkStep(
          transform({ oldItems }, ({ oldItems }) => toLinks(oldItems))
        )

        const oldItemIds = transform({ oldItems }, ({ oldItems }) =>
          oldItems.map((item: { id: string }) => item.id)
        )

        deleteLookItemsStep(oldItemIds)

        const items = createLookItemsStep(
          transform({ input }, ({ input }) => ({
            look_id: input.id,
            product_ids: input.product_ids ?? [],
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
      }
    )

    return new WorkflowResponse(look)
  }
)
