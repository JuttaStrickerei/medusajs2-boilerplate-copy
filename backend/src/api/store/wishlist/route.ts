import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../modules/wishlist"
import WishlistModuleService from "../../../modules/wishlist/service"
import { addWishlistItemWorkflow } from "../../../workflows/add-wishlist-item"
import { removeWishlistItemWorkflow } from "../../../workflows/remove-wishlist-item"
import { AddWishlistItemSchema, RemoveWishlistItemSchema } from "./middlewares"

// GET /store/wishlist — retrieve all wishlist items for the authenticated customer
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id

  const wishlistService: WishlistModuleService =
    req.scope.resolve(WISHLIST_MODULE)

  const items = await wishlistService.listWishlistItems(
    { customer_id: customerId },
    { order: { created_at: "DESC" } }
  )

  return res.json({ wishlist_items: items })
}

// POST /store/wishlist — add a product to the wishlist
export async function POST(
  req: AuthenticatedMedusaRequest<AddWishlistItemSchema>,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id
  const { product_id, variant_id } = req.validatedBody

  const { result } = await addWishlistItemWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
      product_id,
      variant_id: variant_id ?? null,
    },
  })

  return res.json({ wishlist_item: result })
}

// DELETE /store/wishlist — remove a product from the wishlist
export async function DELETE(
  req: AuthenticatedMedusaRequest<RemoveWishlistItemSchema>,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id
  const { product_id } = req.validatedBody

  await removeWishlistItemWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
      product_id,
    },
  })

  return res.json({ success: true })
}
