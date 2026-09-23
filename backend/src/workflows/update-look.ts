import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import {
  createRemoteLinkStep,
  removeRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { LOOK_MODULE } from "../modules/look"
import { updateLookStep, UpdateLookStepInput } from "./steps/update-look"
import { createLookItemsStep } from "./steps/create-look-items"
import { deleteLookItemsStep } from "./steps/delete-look-items"

// { [modul]: { [linkable-feld]: ids } } – Eingabeformat von removeRemoteLinkStep
type LinksToRemove = Record<string, Record<string, string[]>>

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
          fields: ["id", "items.id"],
          filters: { id: input.id },
        })

        const oldItemIds = transform({ existing }, ({ existing }) =>
          (existing[0]?.items ?? [])
            .filter(Boolean)
            .map((item: { id: string }) => item.id)
        )

        removeRemoteLinkStep(
          transform({ oldItemIds }, ({ oldItemIds }): LinksToRemove => ({
            [LOOK_MODULE]: { look_item_id: oldItemIds },
          }))
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
