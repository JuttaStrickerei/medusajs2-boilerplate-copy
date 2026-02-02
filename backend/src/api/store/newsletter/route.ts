import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, MedusaError } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"
import { z } from "zod"
import { EmailTemplates } from "../../../modules/email-notifications/templates"

export const newsletterSignupSchema = z.object({
  email: z.string().email(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const notificationModuleService: INotificationModuleService = req.scope.resolve(Modules.NOTIFICATION)
  
  try {
    // Use Zod validation instead of type assertion
    const parseResult = newsletterSignupSchema.safeParse(req.body)
    
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: "Ungültige Eingabe",
        errors: parseResult.error.errors,
      })
    }
    
    const { email, first_name, last_name } = parseResult.data

    logger.debug(`[Newsletter API] Processing signup request`)

    // 1. Direkt Mailchimp aufrufen (NICHT über Event!)
    const mailchimpResult = await notificationModuleService.createNotifications({
      channel: "newsletter",
      to: email,
      template: "newsletter-signup",
      data: {
        first_name: first_name || "",
        last_name: last_name || "",
      },
    })

    logger.debug(`[Newsletter API] Mailchimp result received`)

    // 2. Prüfen ob bereits abonniert
    const notificationResult = Array.isArray(mailchimpResult) ? mailchimpResult[0] : mailchimpResult
    const externalId = notificationResult?.external_id || ""
    const isAlreadySubscribed = externalId === "ALREADY_SUBSCRIBED"

    if (isAlreadySubscribed) {
      logger.debug(`[Newsletter API] Subscriber already exists`)
      
      return res.status(200).json({
        success: true,
        message: "Sie haben sich bereits online oder in der Strickerei für den Newsletter angemeldet. Wir freuen uns, dass Sie dabei sind!",
        alreadySubscribed: true,
      })
    }

    // 3. Neue Anmeldung: Bestätigungs-E-Mail senden
    logger.debug(`[Newsletter API] New subscriber - sending confirmation email`)
    
    // Wrap in try-catch - email failure should not fail the subscription
    try {
      await notificationModuleService.createNotifications({
        channel: "email",
        to: email,
        template: EmailTemplates.NEWSLETTER_CONFIRMATION,
        data: {
          emailOptions: {
            subject: "Willkommen bei Strickerei Jutta! 🧶",
          },
          firstName: first_name || undefined,
          email: email,
          preview: "Willkommen in unserem Newsletter!",
        },
      })
    } catch (emailError) {
      // Log but don't fail - the subscription was successful
      logger.warn(`[Newsletter API] Confirmation email failed, but subscription succeeded`)
    }

    logger.info(`[Newsletter API] Subscription completed successfully`)

    return res.status(200).json({
      success: true,
      message: "Vielen Dank für Ihre Anmeldung! Sie erhalten in Kürze eine Bestätigungs-E-Mail.",
      alreadySubscribed: false,
    })

  } catch (error: unknown) {
    logger.error(`[Newsletter API] Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    
    // Check for MedusaError with INVALID_DATA type (invalid email from Mailchimp)
    if (error instanceof MedusaError && error.type === MedusaError.Types.INVALID_DATA) {
      return res.status(400).json({
        success: false,
        message: "Bitte geben Sie eine gültige E-Mail-Adresse ein. Falls Sie sicher sind, dass Ihre Adresse korrekt ist, kontaktieren Sie uns bitte über unser Kontaktformular. Wir helfen Ihnen gerne weiter!",
      })
    }
    
    // Fallback: Check for string patterns (for backwards compatibility)
    if (
      error instanceof Error &&
      (error.message?.includes("gültige E-Mail") || 
       error.message?.includes("valid email") ||
       error.message?.includes("Invalid Resource"))
    ) {
      return res.status(400).json({
        success: false,
        message: "Bitte geben Sie eine gültige E-Mail-Adresse ein. Falls Sie sicher sind, dass Ihre Adresse korrekt ist, kontaktieren Sie uns bitte über unser Kontaktformular. Wir helfen Ihnen gerne weiter!",
      })
    }
    
    return res.status(500).json({
      success: false,
      message: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
    })
  }
}

