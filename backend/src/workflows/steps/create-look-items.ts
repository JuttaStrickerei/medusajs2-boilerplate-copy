import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { LOOK_MODULE } from "../../modules/look"
import LookModuleService from "../../modules/look/service"

type CreateLookItemsStepInput = {
  look_id: string
  product_ids: string[]
}

// Legt pro Produkt ein Look-Teil an; die Reihenfolge der product_ids
// bestimmt den rank.
export const createLookItemsStep = createStep(
  "create-look-items",
  async ({ look_id, product_ids }: CreateLookItemsStepInput, { container }) => {
    const lookService: LookModuleService = container.resolve(LOOK_MODULE)

    if (!product_ids.length) {
      return new StepResponse([], [])
    }

    const items = await lookService.createLookItems(
      product_ids.map((_, rank) => ({ look_id, rank }))
    )

    // product_id an das jeweilige Item hängen, damit der Link-Step es nutzen kann
    const itemsWithProduct = items.map((item, i) => ({
      id: item.id,
      product_id: product_ids[i],
    }))

    return new StepResponse(
      itemsWithProduct,
      items.map((i) => i.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    const lookService: LookModuleService = container.resolve(LOOK_MODULE)
    await lookService.deleteLookItems(ids)
  }
)
