import { INotificationModuleService, Logger } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { PUBLIC_BACKEND_URL, STOREFRONT_URL } from '../lib/constants'
import { EmailTemplates } from '../modules/email-notifications/templates'

type PasswordResetEvent = {
  // emailpass: the email address
  entity_id: string
  // "customer" (shop) or "user" (admin)
  actor_type: string
  // JWT, valid 15 minutes
  token: string
}

/**
 * Sends the "set a new password" email (Medusa standard flow).
 *
 * POST /auth/{customer|user}/emailpass/reset-password creates a token and
 * emits auth.password_reset. Customers get a link to the shop, which stores
 * the token in a cookie and opens /at/reset-password (so the token never
 * shows up in page URLs that analytics/pixel report). Admin users get the
 * standard admin page /app/reset-password.
 */
export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<PasswordResetEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as Logger
  const { entity_id: email, actor_type: actorType, token } = data

  if (!email?.includes('@') || !token) {
    logger.warn(`[PasswordReset] Skipped: no email or token (actor ${actorType})`)
    return
  }

  let resetUrl: string
  if (actorType === 'customer') {
    resetUrl = `${STOREFRONT_URL}/api/reset-password?token=${encodeURIComponent(token)}`
  } else if (actorType === 'user') {
    resetUrl = `${PUBLIC_BACKEND_URL}/app/reset-password?token=${encodeURIComponent(token)}`
  } else {
    logger.warn(`[PasswordReset] Skipped: unknown actor type ${actorType}`)
    return
  }

  try {
    const notificationModuleService: INotificationModuleService = container.resolve(
      Modules.NOTIFICATION
    )

    await notificationModuleService.createNotifications({
      to: email,
      channel: 'email',
      template: EmailTemplates.PASSWORD_RESET,
      data: {
        emailOptions: {
          replyTo: 'office@strickerei-jutta.at',
          subject: 'Ihr neues Passwort für die Strickerei Jutta',
        },
        resetUrl,
        actorType,
        preview: 'Mit diesem Link legen Sie ein neues Passwort fest.',
      },
    })
    // No address and no token in the log
    logger.info(`[PasswordReset] Email sent (actor ${actorType})`)
  } catch (error) {
    // Subscribers must not throw. The shop still shows its neutral
    // "check your inbox" message, so log clearly for support.
    logger.error(`[PasswordReset] Email FAILED (actor ${actorType}):`, error)
  }
}

export const config: SubscriberConfig = {
  event: 'auth.password_reset',
}
