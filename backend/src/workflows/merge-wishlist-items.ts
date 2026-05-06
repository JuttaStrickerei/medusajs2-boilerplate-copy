import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { mergeWishlistItemsStep } from "./steps/merge-wishlist-items"

type MergeWishlistItemsInput = {
  customer_id: string
  items: Array<{ product_id: string; variant_id?: string | null }>
}

export const mergeWishlistItemsWorkflow = createWorkflow(
  "merge-wishlist-items",
  function (input: MergeWishlistItemsInput) {
    const items = mergeWishlistItemsStep(input)
    return new WorkflowResponse(items)
  }
)
