import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { WISHLIST_MODULE } from "../../modules/wishlist"
import WishlistModuleService from "../../modules/wishlist/service"

type AddWishlistItemInput = {
  customer_id: string
  product_id: string
  variant_id?: string | null
}

export const addWishlistItemStep = createStep(
  "add-wishlist-item",
  async (input: AddWishlistItemInput, { container }) => {
    const wishlistService: WishlistModuleService =
      container.resolve(WISHLIST_MODULE)

    // Check if already exists
    const existing = await wishlistService.listWishlistItems({
      customer_id: input.customer_id,
      product_id: input.product_id,
    })

    if (existing.length > 0) {
      // Already in wishlist, return existing
      return new StepResponse(existing[0], existing[0].id)
    }

    const item = await wishlistService.createWishlistItems({
      customer_id: input.customer_id,
      product_id: input.product_id,
      variant_id: input.variant_id ?? null,
    })

    return new StepResponse(item, item.id)
  },
  async (id, { container }) => {
    if (!id) return
    const wishlistService: WishlistModuleService =
      container.resolve(WISHLIST_MODULE)
    await wishlistService.deleteWishlistItems(id)
  }
)
