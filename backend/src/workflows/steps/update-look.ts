import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { LOOK_MODULE } from "../../modules/look"
import LookModuleService from "../../modules/look/service"
import type { CreateLookStepInput } from "./create-look"

export type UpdateLookStepInput = { id: string } & Partial<CreateLookStepInput>

export const updateLookStep = createStep(
  "update-look",
  async ({ id, ...data }: UpdateLookStepInput, { container }) => {
    const lookService: LookModuleService = container.resolve(LOOK_MODULE)

    const prev = await lookService.retrieveLook(id)
    const look = await lookService.updateLooks({ id, ...data })

    return new StepResponse(look, prev)
  },
  async (prev, { container }) => {
    if (!prev) return
    const lookService: LookModuleService = container.resolve(LOOK_MODULE)
    await lookService.updateLooks({
      id: prev.id,
      title: prev.title,
      handle: prev.handle,
      description: prev.description,
      images: prev.images,
      status: prev.status,
      rank: prev.rank,
      metadata: prev.metadata,
    })
  }
)
