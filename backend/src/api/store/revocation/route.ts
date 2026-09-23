import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"
import { EmailTemplates } from "../../../modules/email-notifications/templates"
import { REVOCATION_MODULE } from "../../../modules/revocation"
import RevocationModuleService from "../../../modules/revocation/service"
import {
  buildDeclarationText,
  formatReceivedAt,
  formatRevocationReference,
} from "../../../modules/revocation/utils"

/**
 * POST /store/revocation
 *
 * Public, guest-accessible online withdrawal (§ 13a FAGG). No login required.
 * The declaration is always persisted first (legal receipt time), then the
 * acknowledgement email goes to the customer and a notice to the shop.
 */

const revocationSchema = z
  .object({
    name: z.string().trim().min(1, "Name ist erforderlich").max(200, "Name ist zu lang"),
    orderReference: z
      .string()
      .trim()
      .min(1, "Bestell- oder Rechnungsnummer ist erforderlich")
      .max(100, "Bestell- oder Rechnungsnummer ist zu lang"),
    email: z.string().trim().email("Ungültige E-Mail-Adresse").max(320),
    scope: z.enum(["full", "partial"]),
    partialText: z.string().trim().max(2000, "Beschreibung ist zu lang").optional(),
    // Honeypot: hidden from users and assistive tech, only bots fill it
    company_website: z.string().optional(),
  })
  .refine((d) => d.scope === "full" || !!d.partialText, {
    message: "Bitte geben Sie an, welche Artikel Sie widerrufen möchten",
    path: ["partialText"],
  })

// Simple in-memory throttle per client IP (single backend instance on Railway)
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const recentRequests = new Map<string, number[]>()

const isRateLimited = (ip: string) => {
  const now = Date.now()
  const hits = (recentRequests.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  hits.push(now)
  recentRequests.set(ip, hits)

  // Keep the map from growing without bound
  if (recentRequests.size > 5000) {
    for (const [key, times] of recentRequests) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) recentRequests.delete(key)
    }
  }

  return hits.length > RATE_LIMIT_MAX
}

const getClientIp = (req: MedusaRequest) =>
  (req.headers["x-real-ip"] as string | undefined) ||
  (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
  req.ip ||
  "unknown"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Legal receipt time: captured before anything else happens
  const receivedAt = new Date()
  const logger = req.scope.resolve("logger")

  const parsed = revocationSchema.safeParse(req.body)
  if (parsed.success === false) {
    res.status(400).json({ success: false, errors: (parsed as z.SafeParseError<unknown>).error.errors })
    return
  }
  const body = parsed.data

  if (body.company_website) {
    logger.warn("[Revocation] Honeypot triggered, request ignored")
    res.status(200).json({ success: true })
    return
  }

  if (isRateLimited(getClientIp(req))) {
    res.status(429).json({
      success: false,
      message:
        "Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut oder senden Sie Ihren Widerruf per E-Mail an office@strickerei-jutta.at.",
    })
    return
  }

  const partialText = body.scope === "partial" ? body.partialText ?? null : null
  const declarationText = buildDeclarationText({
    name: body.name,
    orderReference: body.orderReference,
    scope: body.scope,
    partialText,
  })

  const revocationService: RevocationModuleService = req.scope.resolve(REVOCATION_MODULE)

  let declaration: { id: string; display_id: number }
  try {
    declaration = await revocationService.createRevocationDeclarations({
      received_at: receivedAt,
      customer_name: body.name,
      order_reference: body.orderReference,
      email: body.email,
      scope: body.scope,
      partial_text: partialText,
      declaration_text: declarationText,
    })
  } catch (error) {
    logger.error(
      `[Revocation] Failed to persist declaration: ${error instanceof Error ? error.message : "Unknown error"}`
    )
    res.status(500).json({
      success: false,
      message:
        "Ihr Widerruf konnte technisch nicht gespeichert werden. Bitte versuchen Sie es erneut oder senden Sie ihn per E-Mail an office@strickerei-jutta.at.",
    })
    return
  }

  const reference = formatRevocationReference(declaration.display_id)
  const receivedAtFormatted = formatReceivedAt(receivedAt)
  const mailData = {
    reference,
    receivedAt: receivedAtFormatted,
    customerName: body.name,
    orderReference: body.orderReference,
    email: body.email,
    scopeLabel: body.scope === "full" ? "Vollständiger Widerruf" : "Teilweiser Widerruf",
    partialText,
    declarationText,
  }

  const notificationService: INotificationModuleService = req.scope.resolve(Modules.NOTIFICATION)

  // Acknowledgement to the customer (legally required, § 13a Abs 4 FAGG)
  let confirmationSent = false
  try {
    await notificationService.createNotifications({
      channel: "email",
      to: body.email,
      template: EmailTemplates.REVOCATION_CONFIRMATION,
      data: {
        emailOptions: {
          subject: `Eingangsbestätigung Ihres Widerrufs ${reference} – Strickerei Jutta`,
          replyTo: "office@strickerei-jutta.at",
        },
        ...mailData,
        preview: `Ihr Widerruf ist am ${receivedAtFormatted} bei uns eingegangen`,
      },
    })
    confirmationSent = true
    await revocationService.updateRevocationDeclarations({
      id: declaration.id,
      confirmation_sent_at: new Date(),
    })
  } catch (error) {
    logger.error(
      `[Revocation] Confirmation email for ${reference} failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }

  // Notice to the shop; includes a warning if the confirmation failed
  try {
    await notificationService.createNotifications({
      channel: "email",
      to: process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || "office@strickerei-jutta.at",
      template: EmailTemplates.REVOCATION_ADMIN,
      data: {
        emailOptions: {
          subject: `${confirmationSent ? "" : "[ACHTUNG: Bestätigung fehlgeschlagen] "}Online-Widerruf ${reference} – ${body.orderReference}`,
          replyTo: body.email,
        },
        ...mailData,
        confirmationSent,
        preview: `Neuer Online-Widerruf von ${body.name}`,
      },
    })
  } catch (error) {
    logger.error(
      `[Revocation] Admin notification for ${reference} failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }

  logger.info(`[Revocation] ${reference} received (confirmation sent: ${confirmationSent})`)

  res.status(201).json({
    success: true,
    reference,
    received_at: receivedAt.toISOString(),
    received_at_formatted: receivedAtFormatted,
    confirmation_sent: confirmationSent,
  })
}
