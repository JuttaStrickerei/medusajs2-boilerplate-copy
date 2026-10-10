import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type ValidateLookCartItemsInput = {
  look: {
    id: string
    status: string
    items?: {
      product?: {
        id: string
        status?: string
        variants?: { id: string }[]
      } | null
    }[]
  }
  items: { variant_id: string; quantity: number }[]
}

// Stellt sicher, dass der Look veröffentlicht ist und jede übergebene
// Variante zu einem (veröffentlichten) Produkt dieses Looks gehört.
export const validateLookCartItemsStep = createStep(
  "validate-look-cart-items",
  async ({ look, items }: ValidateLookCartItemsInput) => {
    if (look.status !== "published") {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Look with id: ${look.id} was not found`
      )
    }

    const allowedVariantIds = new Set(
      (look.items ?? []).flatMap((item) =>
        item.product && item.product.status === "published"
          ? (item.product.variants ?? []).map((v) => v.id)
          : []
      )
    )

    const invalid = items.filter((i) => !allowedVariantIds.has(i.variant_id))

    if (invalid.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Variants ${invalid
          .map((i) => i.variant_id)
          .join(", ")} are not part of look ${look.id}`
      )
    }

    return new StepResponse(void 0)
  }
)
