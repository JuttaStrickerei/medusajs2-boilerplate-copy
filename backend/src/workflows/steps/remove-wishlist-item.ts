import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { WISHLIST_MODULE } from "../../modules/wishlist"
import WishlistModuleService from "../../modules/wishlist/service"

type RemoveWishlistItemInput = {
  customer_id: string
  product_id: string
}

export const removeWishlistItemStep = createStep(
  "remove-wishlist-item",
  async (input: RemoveWishlistItemInput, { container }) => {
    const wishlistService: WishlistModuleService =
      container.resolve(WISHLIST_MODULE)

    const items = await wishlistService.listWishlistItems({
      customer_id: input.customer_id,
      product_id: input.product_id,
    })

    if (items.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Wishlist item not found"
      )
    }

    const item = items[0]
    await wishlistService.deleteWishlistItems(item.id)

    return new StepResponse({ id: item.id }, item)
  },
  async (deletedItem, { container }) => {
    if (!deletedItem) return
    const wishlistService: WishlistModuleService =
      container.resolve(WISHLIST_MODULE)
    await wishlistService.createWishlistItems({
      customer_id: deletedItem.customer_id,
      product_id: deletedItem.product_id,
      variant_id: deletedItem.variant_id,
    })
  }
)
