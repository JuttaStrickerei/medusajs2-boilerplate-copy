import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { WISHLIST_MODULE } from "../../modules/wishlist"
import WishlistModuleService from "../../modules/wishlist/service"

type MergeWishlistItemsInput = {
  customer_id: string
  items: Array<{ product_id: string; variant_id?: string | null }>
}

export const mergeWishlistItemsStep = createStep(
  "merge-wishlist-items",
  async (input: MergeWishlistItemsInput, { container }) => {
    const wishlistService: WishlistModuleService =
      container.resolve(WISHLIST_MODULE)

    const createdIds: string[] = []

    for (const it of input.items) {
      const existing = await wishlistService.listWishlistItems({
        customer_id: input.customer_id,
        product_id: it.product_id,
      })

      if (existing.length > 0) continue

      const created = await wishlistService.createWishlistItems({
        customer_id: input.customer_id,
        product_id: it.product_id,
        variant_id: it.variant_id ?? null,
      })
      createdIds.push(created.id)
    }

    const full = await wishlistService.listWishlistItems(
      { customer_id: input.customer_id },
      { order: { created_at: "DESC" } }
    )

    return new StepResponse(full, createdIds)
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) return
    const wishlistService: WishlistModuleService =
      container.resolve(WISHLIST_MODULE)
    await wishlistService.deleteWishlistItems(createdIds)
  }
)
