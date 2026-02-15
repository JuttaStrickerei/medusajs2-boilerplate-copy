import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { removeWishlistItemStep } from "./steps/remove-wishlist-item"

type RemoveWishlistItemInput = {
  customer_id: string
  product_id: string
}

export const removeWishlistItemWorkflow = createWorkflow(
  "remove-wishlist-item",
  function (input: RemoveWishlistItemInput) {
    const result = removeWishlistItemStep(input)
    return new WorkflowResponse(result)
  }
)
