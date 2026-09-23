import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { LOOK_MODULE } from "../../modules/look"
import LookModuleService from "../../modules/look/service"

export const deleteLooksStep = createStep(
  "delete-looks",
  async (ids: string[], { container }) => {
    const lookService: LookModuleService = container.resolve(LOOK_MODULE)

    await lookService.softDeleteLooks(ids)

    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    const lookService: LookModuleService = container.resolve(LOOK_MODULE)
    await lookService.restoreLooks(ids)
  }
)
