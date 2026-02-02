import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"
import { EmailTemplates } from "../../../modules/email-notifications/templates"

const contactSchema = z.object({
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Betreff ist erforderlich"),
  message: z.string().min(10, "Nachricht muss mindestens 10 Zeichen haben"),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  
  try {
    const body = contactSchema.parse(req.body)
    
    const notificationService: INotificationModuleService = req.scope.resolve(Modules.NOTIFICATION)
    
    const submittedAt = new Date().toLocaleString("de-AT", { 
      dateStyle: "full", 
      timeStyle: "short" 
    })

    // E-Mail an office@strickerei-jutta.at senden (primary - must succeed)
    await notificationService.createNotifications({
      channel: "email",
      to: "office@strickerei-jutta.at",
      template: EmailTemplates.CONTACT_FORM,
      data: {
        emailOptions: {
          subject: `Kontaktanfrage: ${body.subject}`,
          replyTo: body.email,
        },
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || "Nicht angegeben",
        subject: body.subject,
        message: body.message,
        submittedAt,
        preview: `Neue Kontaktanfrage von ${body.firstName} ${body.lastName}`,
      },
    })

    // Bestätigungs-E-Mail an den Kunden senden (secondary - failure should not fail the request)
    try {
      await notificationService.createNotifications({
        channel: "email",
        to: body.email,
        template: EmailTemplates.CONTACT_FORM_CONFIRMATION,
        data: {
          emailOptions: {
            subject: "Vielen Dank für Ihre Nachricht - Strickerei Jutta",
          },
          firstName: body.firstName,
          subject: body.subject,
          preview: "Bestätigung Ihrer Kontaktanfrage",
        },
      })
    } catch (confirmationError) {
      // Log but don't fail - the main contact was received successfully
      logger.warn(`[Contact] Confirmation email failed, but contact was received`)
    }
    
    logger.debug(`[Contact] Message processed successfully`)
    
    res.status(200).json({ success: true, message: "Nachricht erfolgreich gesendet" })
  } catch (error: unknown) {
    logger.error(`[Contact] Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors })
    } else {
      res.status(500).json({ success: false, message: "Fehler beim Senden der Nachricht" })
    }
  }
}

