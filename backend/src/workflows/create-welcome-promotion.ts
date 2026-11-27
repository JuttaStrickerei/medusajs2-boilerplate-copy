import { randomInt } from "crypto"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createPromotionsStep } from "@medusajs/medusa/core-flows"

// Welcome discount for new newsletter subscribers (storefront: newsletter forms,
// backend: api/store/newsletter). Every subscriber gets a code of her own by
// e-mail. It cannot be guessed, works for one order and expires, so nobody gets
// the discount without signing up.
export const WELCOME_DISCOUNT_PERCENT = 10
export const WELCOME_CODE_VALID_DAYS = 30
export const WELCOME_CODE_PREFIX = "WILLKOMMEN-"

// No 0/O and 1/I: the code is typed by hand from an e-mail
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const CODE_LENGTH = 8
const DAY_MS = 24 * 60 * 60 * 1000

// Own step so that the random code is drawn once and every later use reads the
// same stored value.
const generateWelcomeCodeStep = createStep("generate-welcome-code", async () => {
  let suffix = ""
  for (let i = 0; i < CODE_LENGTH; i++) {
    suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  }
  const now = new Date()

  return new StepResponse({
    code: `${WELCOME_CODE_PREFIX}${suffix}`,
    starts_at: now.toISOString(),
    ends_at: new Date(now.getTime() + WELCOME_CODE_VALID_DAYS * DAY_MS).toISOString(),
  })
})

// Creates one promotion with its own campaign: 10 % on the order, usable once
// (campaign budget "usage", limit 1), valid for 30 days. Same shape as the codes
// made in the admin (percentage, target "order", allocation "across").
export const createWelcomePromotionWorkflow = createWorkflow(
  "create-welcome-promotion",
  function () {
    const generated = generateWelcomeCodeStep()

    const promotions = transform({ generated }, ({ generated }) => [
      {
        code: generated.code,
        type: "standard" as const,
        status: "active" as const,
        is_automatic: false,
        application_method: {
          type: "percentage" as const,
          target_type: "order" as const,
          allocation: "across" as const,
          value: WELCOME_DISCOUNT_PERCENT,
          currency_code: "eur",
        },
        campaign: {
          name: `Newsletter-Willkommen ${generated.code}`,
          campaign_identifier: `newsletter-${generated.code.toLowerCase()}`,
          starts_at: new Date(generated.starts_at),
          ends_at: new Date(generated.ends_at),
          budget: { type: "usage" as const, limit: 1 },
        },
      },
    ])

    createPromotionsStep(promotions)

    const result = transform({ generated }, ({ generated }) => ({
      code: generated.code,
      ends_at: generated.ends_at,
    }))

    return new WorkflowResponse(result)
  }
)

export default createWelcomePromotionWorkflow
