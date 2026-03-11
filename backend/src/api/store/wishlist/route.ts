import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../modules/wishlist"
import WishlistModuleService from "../../../modules/wishlist/service"
import { addWishlistItemWorkflow } from "../../../workflows/add-wishlist-item"
import { removeWishlistItemWorkflow } from "../../../workflows/remove-wishlist-item"
import { AddWishlistItemSchema, RemoveWishlistItemSchema } from "./middlewares"

// GET /store/wishlist — retrieve all wishlist items with enriched product data
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

  if (items.length === 0) {
    return res.json({ wishlist_items: [] })
  }

  const query = req.scope.resolve("query") as any
  const productIds = items.map((item) => item.product_id)

  let productMap = new Map<string, { handle: string; title: string; thumbnail: string | null }>()

  try {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "title", "thumbnail"],
      filters: { id: productIds },
    })

    for (const p of products) {
      productMap.set(p.id, {
        handle: p.handle,
        title: p.title,
        thumbnail: p.thumbnail,
      })
    }
  } catch {
    // If product query fails, return items without enrichment
  }

  const enrichedItems = items.map((item) => {
    const product = productMap.get(item.product_id)
    return {
      ...item,
      product_handle: product?.handle ?? null,
      product_title: product?.title ?? null,
      product_thumbnail: product?.thumbnail ?? null,
    }
  })

  return res.json({ wishlist_items: enrichedItems })
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
