import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { LOOK_MODULE } from "../../modules/look"
import LookModuleService from "../../modules/look/service"

export type CreateLookStepInput = {
  title: string
  handle: string
  description?: string | null
  images?: string[] | null
  status?: "draft" | "published"
  rank?: number
  metadata?: Record<string, unknown> | null
}

export const createLookStep = createStep(
  "create-look",
  async (input: CreateLookStepInput, { container }) => {
    const lookService: LookModuleService = container.resolve(LOOK_MODULE)

    const look = await lookService.createLooks(input)

    return new StepResponse(look, look.id)
  },
  async (id, { container }) => {
    if (!id) return
    const lookService: LookModuleService = container.resolve(LOOK_MODULE)
    await lookService.deleteLooks(id)
  }
)
