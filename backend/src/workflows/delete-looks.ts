import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  dismissRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { deleteLooksStep } from "./steps/delete-looks"
import { toLinks } from "./utils/look-links"

type DeleteLooksWorkflowInput = {
  ids: string[]
}

export const deleteLooksWorkflow = createWorkflow(
  "delete-looks",
  function (input: DeleteLooksWorkflowInput) {
    const { data: looks } = useQueryGraphStep({
      entity: "look",
      fields: ["id", "items.id", "items.product_link.product_id"],
      filters: { id: input.ids },
    })

    const items = transform({ looks }, ({ looks }) =>
      looks.flatMap((look) => (look.items ?? []).filter(Boolean))
    )

    // Nur die Link-Zeilen entfernen – niemals die Produkte selbst
    dismissRemoteLinkStep(transform({ items }, ({ items }) => toLinks(items)))

    deleteLooksStep(input.ids)

    return new WorkflowResponse(input.ids)
  }
)
