import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework" 

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ email: string, first_name: string, last_name: string }>) {
  const logger = container.resolve("logger")
  const notificationModuleService = container.resolve("notification")

  // Debug: Log subscriber execution
  logger.info(`[Newsletter Subscriber] Processing newsletter signup event - email: ${data.email}, first_name: ${data.first_name || 'none'}, last_name: ${data.last_name || 'none'}`)

  try {
    logger.info(`[Newsletter Subscriber] Creating notification with channel 'newsletter'`)
    
    const result = await notificationModuleService.createNotifications({
      channel: "newsletter",
      to: data.email,
      template: "newsletter-signup",
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
      },
    })

    logger.info(`[Newsletter Subscriber] Notification created successfully`)
    logger.info(`[Newsletter Subscriber] Result: ${JSON.stringify(result, null, 2)}`)
  } catch (error: any) {
    logger.error(`[Newsletter Subscriber] Failed to create notification`)
    logger.error(`[Newsletter Subscriber] Error: ${error.message}`)
    logger.error(`[Newsletter Subscriber] Error type: ${error.constructor.name}`)
    logger.error(`[Newsletter Subscriber] Full error: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
    throw error
  }
}

export const config: SubscriberConfig = {
  event: `newsletter.signup`,
}

