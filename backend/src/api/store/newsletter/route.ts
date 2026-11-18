import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules, MedusaError } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"
import { z } from "zod"
import { EmailTemplates } from "../../../modules/email-notifications/templates"
import { STOREFRONT_URL } from "../../../lib/constants"
import {
  createWelcomePromotionWorkflow,
  WELCOME_DISCOUNT_PERCENT,
} from "../../../workflows/create-welcome-promotion"

// Stücke, die die Willkommens-Mail zeigt (Bild, Name, Link, ohne Preise), in dieser Reihenfolge
const WELCOME_MAIL_PRODUCT_HANDLES = ["mantel-rouga", "mantel-bruna", "mantel-nera"]
const SHOP_PRODUCT_URL = `${STOREFRONT_URL}/at/products`
// Zwei Looks mit Foto vom Shooting für die Willkommens-Mail (Reihenfolge = Anzeige)
const WELCOME_MAIL_LOOK_HANDLES = ["look-rouga", "look-viola"]
const SHOP_LOOK_URL = `${STOREFRONT_URL}/at/looks`

export const newsletterSignupSchema = z.object({
  email: z.string().email(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const notificationModuleService: INotificationModuleService = req.scope.resolve(Modules.NOTIFICATION)
  
  try {
    // Use Zod validation (same pattern as contact route)
    const { email, first_name, last_name } = newsletterSignupSchema.parse(req.body)
    
    // Extra check for email (should be caught by Zod, but defense in depth)
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "E-Mail-Adresse ist erforderlich",
      })
    }

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

    // Schon in der Liste und angemeldet (online, auf der Website oder in der Strickerei):
    // kein zweiter Eintrag, kein Code. Der Willkommens-Code ist für neue Anmeldungen.
    if (isAlreadySubscribed) {
      logger.debug(`[Newsletter API] Subscriber already exists`)
      
      return res.status(200).json({
        success: true,
        message: "Sie sind schon bei unserem Newsletter dabei, danke! Der Willkommens-Code gilt für neue Anmeldungen.",
        alreadySubscribed: true,
      })
    }

    // In der Liste, aber abgemeldet oder unzustellbar: Mailchimp lässt die Schnittstelle
    // nicht wieder anmelden. Der Link führt zum Anmeldeformular der Liste.
    if (externalId.startsWith("NOT_SUBSCRIBED")) {
      const candidate = externalId.split(" ")[1]
      const signupUrl = candidate && /^https:\/\/\S+$/.test(candidate) ? candidate : undefined
      logger.debug(`[Newsletter API] Address is in the list but not subscribed`)

      return res.status(200).json({
        success: true,
        alreadySubscribed: false,
        notSubscribed: true,
        signupUrl,
        message: signupUrl
          ? "Diese Adresse ist bei unserem Newsletter derzeit nicht angemeldet. Über den Link können Sie sich wieder anmelden."
          : "Diese Adresse ist bei unserem Newsletter derzeit nicht angemeldet. Schreiben Sie uns gern an office@strickerei-jutta.at, wir helfen Ihnen weiter.",
      })
    }

    // 3. Neue Anmeldung: eigenen Willkommens-Code anlegen (10 %, einmal gültig, 30 Tage).
    // Der Code steht nur in der Bestätigungs-E-Mail. Wer sich nicht anmeldet, kennt keinen.
    // Schlägt das Anlegen fehl, bleibt die Anmeldung gültig und die E-Mail geht ohne Code hinaus.
    let welcomeCode: { code: string; ends_at: string } | null = null
    try {
      const { result } = await createWelcomePromotionWorkflow(req.scope).run()
      welcomeCode = result
    } catch (promotionError) {
      logger.warn(
        `[Newsletter API] Welcome code could not be created: ${
          promotionError instanceof Error ? promotionError.message : "unknown error"
        }`
      )
    }

    // Stücke für die E-Mail nachschlagen (nur lesen). Scheitert das, geht die E-Mail ohne sie hinaus.
    let welcomeProducts: { title: string; url: string; image: string }[] = []
    try {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["handle", "title", "thumbnail"],
        filters: { handle: WELCOME_MAIL_PRODUCT_HANDLES, status: "published" },
      })
      welcomeProducts = WELCOME_MAIL_PRODUCT_HANDLES.flatMap((handle) => {
        const product = products.find((p) => p.handle === handle)
        return product?.thumbnail
          ? [{ title: product.title, url: `${SHOP_PRODUCT_URL}/${handle}`, image: product.thumbnail }]
          : []
      })
    } catch (productsError) {
      logger.warn(
        `[Newsletter API] Products for the welcome mail could not be loaded: ${
          productsError instanceof Error ? productsError.message : "unknown error"
        }`
      )
    }

    // Looks für die E-Mail nachschlagen (nur lesen). Scheitert das, geht die E-Mail ohne sie hinaus.
    let welcomeLooks: { title: string; url: string; image: string }[] = []
    try {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: looks } = await query.graph({
        entity: "look",
        fields: ["handle", "title", "images"],
        filters: { handle: WELCOME_MAIL_LOOK_HANDLES, status: "published" },
      })
      welcomeLooks = WELCOME_MAIL_LOOK_HANDLES.flatMap((handle) => {
        const look = looks.find((l) => l.handle === handle)
        // das erste Bild ist das Hero-Bild des Looks
        const image = Array.isArray(look?.images) ? look.images[0] : undefined
        return look && typeof image === "string"
          ? [{ title: look.title, url: `${SHOP_LOOK_URL}/${handle}`, image }]
          : []
      })
    } catch (looksError) {
      logger.warn(
        `[Newsletter API] Looks for the welcome mail could not be loaded: ${
          looksError instanceof Error ? looksError.message : "unknown error"
        }`
      )
    }

    // 4. Bestätigungs-E-Mail senden
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
          preview: welcomeCode
            ? `Ihr Gutscheincode: ${WELCOME_DISCOUNT_PERCENT} % auf Ihre erste Bestellung`
            : "Willkommen in unserem Newsletter!",
          ...(welcomeCode
            ? {
                discountCode: welcomeCode.code,
                discountPercent: WELCOME_DISCOUNT_PERCENT,
                discountValidUntil: new Intl.DateTimeFormat("de-AT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Europe/Vienna",
                }).format(new Date(welcomeCode.ends_at)),
              }
            : {}),
          products: welcomeProducts,
          looks: welcomeLooks,
          shopUrl: STOREFRONT_URL,
        },
      })
    } catch (emailError) {
      // Log but don't fail - the subscription was successful
      logger.warn(`[Newsletter API] Confirmation email failed, but subscription succeeded`)
      // Ohne E-Mail hat die Kundin den Code nicht bekommen
      welcomeCode = null
    }

    logger.info(`[Newsletter API] Subscription completed successfully`)

    return res.status(200).json({
      success: true,
      message: welcomeCode
        ? "Vielen Dank für Ihre Anmeldung! Ihren Gutscheincode finden Sie gleich in der Bestätigungs-E-Mail."
        : "Vielen Dank für Ihre Anmeldung! Sie erhalten in Kürze eine Bestätigungs-E-Mail.",
      alreadySubscribed: false,
      welcomeCodeSent: !!welcomeCode,
    })

  } catch (error: unknown) {
    logger.error(`[Newsletter API] Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    
    // Zod validation error
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Ungültige Eingabe",
        errors: error.errors,
      })
    }
    
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

