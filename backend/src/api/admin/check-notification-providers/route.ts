import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Helper endpoint to check notification providers setup
 * GET /admin/check-notification-providers
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const notificationService = req.scope.resolve(Modules.NOTIFICATION)
    const logger = req.scope.resolve("logger")
    
    // Try to list providers (if method exists)
    let providers: any[] = []
    try {
      if (typeof (notificationService as any).listProviders === 'function') {
        providers = await (notificationService as any).listProviders()
      }
    } catch (e) {
      logger.info(`Could not list providers: ${e}`)
    }

    // Check ENV variables
    const envCheck = {
      MAILCHIMP_API_KEY: !!process.env.MAILCHIMP_API_KEY,
      MAILCHIMP_SERVER: !!process.env.MAILCHIMP_SERVER,
      MAILCHIMP_LIST_ID: !!process.env.MAILCHIMP_LIST_ID,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: !!process.env.RESEND_FROM_EMAIL,
      SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
      SENDGRID_FROM_EMAIL: !!process.env.SENDGRID_FROM_EMAIL,
    }

    return res.json({
      providers: providers.map(p => ({ 
        id: p.id,
        identifier: p.identifier || 'unknown',
      })),
      env_variables: envCheck,
      summary: {
        mailchimp_configured: envCheck.MAILCHIMP_API_KEY && envCheck.MAILCHIMP_SERVER && envCheck.MAILCHIMP_LIST_ID,
        resend_configured: envCheck.RESEND_API_KEY && envCheck.RESEND_FROM_EMAIL,
        sendgrid_configured: envCheck.SENDGRID_API_KEY && envCheck.SENDGRID_FROM_EMAIL,
        providers_count: providers.length,
      },
    })
  } catch (error) {
    // Security: Don't expose stack traces in production
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    })
  }
}

