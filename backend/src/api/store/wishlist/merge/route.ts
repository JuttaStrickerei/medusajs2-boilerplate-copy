import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { mergeWishlistItemsWorkflow } from "../../../../workflows/merge-wishlist-items"
import { MergeWishlistSchema } from "../middlewares"

// POST /store/wishlist/merge — append guest wishlist items to the customer's
// wishlist. Append-only + idempotent: duplicates on (customer_id, product_id)
// are skipped. Returns the full current wishlist for the customer.
export async function POST(
  req: AuthenticatedMedusaRequest<MergeWishlistSchema>,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id
  const { items } = req.validatedBody

  const { result } = await mergeWishlistItemsWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
      items: items.map((it) => ({
        product_id: it.product_id,
        variant_id: it.variant_id ?? null,
      })),
    },
  })

  return res.json({ wishlist_items: result })
}
