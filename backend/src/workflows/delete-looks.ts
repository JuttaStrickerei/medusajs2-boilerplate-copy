import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  removeRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { LOOK_MODULE } from "../modules/look"
import { deleteLooksStep } from "./steps/delete-looks"

type DeleteLooksWorkflowInput = {
  ids: string[]
}

// { [modul]: { [linkable-feld]: ids } } – Eingabeformat von removeRemoteLinkStep
type LinksToRemove = Record<string, Record<string, string[]>>

export const deleteLooksWorkflow = createWorkflow(
  "delete-looks",
  function (input: DeleteLooksWorkflowInput) {
    const { data: looks } = useQueryGraphStep({
      entity: "look",
      fields: ["id", "items.id"],
      filters: { id: input.ids },
    })

    const itemIds = transform({ looks }, ({ looks }) =>
      looks.flatMap((look) =>
        (look.items ?? [])
          .filter(Boolean)
          .map((item: { id: string }) => item.id)
      )
    )

    removeRemoteLinkStep(
      transform({ itemIds }, ({ itemIds }): LinksToRemove => ({
        [LOOK_MODULE]: { look_item_id: itemIds },
      }))
    )

    deleteLooksStep(input.ids)

    return new WorkflowResponse(input.ids)
  }
)
