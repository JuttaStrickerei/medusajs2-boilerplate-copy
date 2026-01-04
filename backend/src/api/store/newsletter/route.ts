import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

export const newsletterSignupSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
})

export async function POST(
  req: MedusaRequest<z.infer<typeof newsletterSignupSchema>>,
  res: MedusaResponse
) {
  const eventModuleService = req.scope.resolve("event_bus")
  const logger = req.scope.resolve("logger")

  // Use req.body as validatedBody might not be set by middleware
  const body = req.body || req.validatedBody

  // Debug: Log incoming request
  logger.info(`[Newsletter API] Received newsletter signup request - email: ${body.email}, first_name: ${body.first_name || 'none'}, last_name: ${body.last_name || 'none'}, hasBody: ${!!req.body}, hasValidatedBody: ${!!req.validatedBody}`)

  await eventModuleService.emit({
    name: "newsletter.signup",
    data: {
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
    },
  })

  logger.info("[Newsletter API] Event 'newsletter.signup' emitted successfully")

  res.json({
    success: true,
  })
}

