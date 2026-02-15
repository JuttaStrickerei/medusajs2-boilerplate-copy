import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { addWishlistItemStep } from "./steps/add-wishlist-item"

type AddWishlistItemInput = {
  customer_id: string
  product_id: string
  variant_id?: string | null
}

export const addWishlistItemWorkflow = createWorkflow(
  "add-wishlist-item",
  function (input: AddWishlistItemInput) {
    const item = addWishlistItemStep(input)
    return new WorkflowResponse(item)
  }
)
