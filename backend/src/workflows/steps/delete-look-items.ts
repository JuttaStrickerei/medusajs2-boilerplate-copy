import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { LOOK_MODULE } from "../../modules/look"
import LookModuleService from "../../modules/look/service"

export const deleteLookItemsStep = createStep(
  "delete-look-items",
  async (ids: string[], { container }) => {
    const lookService: LookModuleService = container.resolve(LOOK_MODULE)

    if (!ids.length) {
      return new StepResponse(void 0, [])
    }

    await lookService.softDeleteLookItems(ids)

    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    const lookService: LookModuleService = container.resolve(LOOK_MODULE)
    await lookService.restoreLookItems(ids)
  }
)
