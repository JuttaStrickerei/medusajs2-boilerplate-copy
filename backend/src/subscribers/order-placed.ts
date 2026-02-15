import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService, Logger } from '@medusajs/framework/types'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as Logger
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  const adminNotificationEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || "office@strickerei-jutta.at"
  const adminBaseUrl =
    process.env.MEDUSA_ADMIN_URL?.trim() || "http://localhost:9000/app"
  
  logger.info(`[OrderPlaced] Processing order: ${data.id}`)

  try {
    const order = await orderModuleService.retrieveOrder(data.id, { 
      relations: ['items', 'summary', 'shipping_address'] 
    })
    logger.debug(`[OrderPlaced] Order data loaded for order ${data.id}`)
    
    // Null-check for shipping_address (e.g., digital products may not have one)
    if (!order.shipping_address?.id) {
      logger.warn(`[OrderPlaced] No shipping address for order ${data.id}, using billing address or skipping`)
    }
    
    const shippingAddress = order.shipping_address?.id 
      ? await (orderModuleService as any).orderAddressService_.retrieve(order.shipping_address.id)
      : order.shipping_address || null
    logger.debug(`[OrderPlaced] Shipping address loaded`)

    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_PLACED,
      data: {
        emailOptions: {
          replyTo: 'office@strickerei-jutta.at',
          subject: 'Ihre Bestellung wurde aufgegeben.'
        },
        order,
        shippingAddress,
        preview: 'Vielen Dank für die Bestellung!'
      }
    })
    logger.info(`[OrderPlaced] Order confirmation sent successfully for order ${data.id}`)

    // FIX: Send an additional admin notification without altering customer confirmation flow.
    await notificationModuleService.createNotifications({
      to: adminNotificationEmail,
      from: adminNotificationEmail,
      channel: "email",
      template: EmailTemplates.ADMIN_ORDER_NOTIFICATION,
      data: {
        emailOptions: {
          replyTo: adminNotificationEmail,
          subject: `Neue Bestellung #${order.display_id} - Strickerei Jutta`,
        },
        order,
        shippingAddress,
        adminOrderUrl: `${adminBaseUrl}/orders/${order.id}`,
        preview: `Neue Bestellung #${order.display_id}`,
      },
    })
    logger.info(`[OrderPlaced] Admin notification sent successfully for order ${data.id}`)
  } catch (error) {
    logger.error(`[OrderPlaced] Error sending order confirmation notification for order ${data.id}:`, error)
    // Don't throw - subscribers should never throw errors
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed'
}