import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"
import { EmailTemplates } from "../../../modules/email-notifications/templates"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const notificationModuleService: INotificationModuleService = req.scope.resolve(Modules.NOTIFICATION)
  
  try {
    const { email, first_name, last_name } = req.body as {
      email: string
      first_name?: string
      last_name?: string
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "E-Mail-Adresse ist erforderlich",
      })
    }

    logger.info(`[Newsletter API] Processing signup for: ${email}`)

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

    logger.info(`[Newsletter API] Mailchimp result: ${JSON.stringify(mailchimpResult)}`)

    // 2. Prüfen ob bereits abonniert
    const notificationResult = Array.isArray(mailchimpResult) ? mailchimpResult[0] : mailchimpResult
    const externalId = notificationResult?.external_id || ""
    const isAlreadySubscribed = externalId === "ALREADY_SUBSCRIBED"

    if (isAlreadySubscribed) {
      logger.info(`[Newsletter API] ${email} is already subscribed`)
      
      return res.status(200).json({
        success: true,
        message: "Sie haben sich bereits online oder in der Strickerei für den Newsletter angemeldet. Wir freuen uns, dass Sie dabei sind!",
        alreadySubscribed: true,
      })
    }

    // 3. Neue Anmeldung: Bestätigungs-E-Mail senden
    logger.info(`[Newsletter API] ${email} is NEW - sending confirmation email`)
    
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

    logger.info(`[Newsletter API] Confirmation email sent to ${email}`)

    return res.status(200).json({
      success: true,
      message: "Vielen Dank für Ihre Anmeldung! Sie erhalten in Kürze eine Bestätigungs-E-Mail.",
      alreadySubscribed: false,
    })

  } catch (error: unknown) {
    logger.error(`[Newsletter API] Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    
    // Ungültige E-Mail
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

