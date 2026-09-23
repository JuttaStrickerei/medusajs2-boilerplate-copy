import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  addToCartWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { validateLookCartItemsStep } from "./steps/validate-look-cart-items"

type AddLookToCartWorkflowInput = {
  cart_id: string
  look_id: string
  items: { variant_id: string; quantity: number }[]
}

// Legt alle gewählten Varianten eines Looks in einem Schritt in den Warenkorb.
// Die Positionen sind normale Warenkorbzeilen zu normalen Preisen und bekommen
// bewusst keine look_id-Metadaten, damit sie mit Einzelkäufen derselben
// Variante zusammengeführt werden. addToCartWorkflow sperrt den Warenkorb
// bereits selbst (acquireLockStep), deshalb hier kein zusätzlicher Lock.
export const addLookToCartWorkflow = createWorkflow(
  "add-look-to-cart",
  function (input: AddLookToCartWorkflowInput) {
    const { data: looks } = useQueryGraphStep({
      entity: "look",
      fields: [
        "id",
        "status",
        "items.product.id",
        "items.product.status",
        "items.product.variants.id",
      ],
      filters: { id: input.look_id },
      options: { throwIfKeyNotFound: true },
    })

    validateLookCartItemsStep(
      transform({ looks, input }, ({ looks, input }) => ({
        look: looks[0],
        items: input.items,
      }))
    )

    addToCartWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id,
        items: input.items,
      },
    })

    return new WorkflowResponse(void 0)
  }
)
