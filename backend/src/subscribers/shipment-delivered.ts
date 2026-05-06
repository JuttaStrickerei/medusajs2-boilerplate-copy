import { Modules } from '@medusajs/framework/utils'
import { Logger } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { INVOICE_MODULE } from "../modules/invoice_generator"
import InvoiceGeneratorService from "../modules/invoice_generator/service"
import { isPickupFulfillment } from '../lib/is-pickup'

export default async function deliveryCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve("logger") as Logger
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService = container.resolve(Modules.ORDER)

  logger.info(`[ShipmentDelivered] Processing delivery: ${data.id}`)

  try {
    // Resolve the query directly from the container parameter
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: order_fulfillment } = await query.graph({
      entity: "order_fulfillment",
      fields: [
        "order_id",
        "fulfillment_id",
      ],
      filters: {
        fulfillment_id: data.id,
      },
    })

    // Null-check for order_fulfillment
    if (!order_fulfillment || order_fulfillment.length === 0) {
      logger.warn(`[ShipmentDelivered] No order_fulfillment found for fulfillment ${data.id}`)
      return
    }

    // The order ID will be available in order_fulfillment[0].order_id
    const orderId = order_fulfillment[0].order_id
    logger.info(`[ShipmentDelivered] Delivery ${data.id} is for order ${orderId}`)

    // Discriminate via shipping_option's fulfillment_set type, not via
    // fulfillment.requires_shipping (the latter is empirically unreliable
    // in this codebase — same root cause as the admin UI fix in 313e0e9).
    const isPickup = await isPickupFulfillment(container, data.id)

    const order = await orderModuleService.retrieveOrder(orderId, {
      relations: ['items', 'summary', 'shipping_address'],
    })
    logger.debug(`[ShipmentDelivered] Order data loaded for order ${orderId}`)

    // Get company logo from invoice config (used by both branches)
    const invoiceGeneratorService = container.resolve(INVOICE_MODULE) as InvoiceGeneratorService
    const invoiceConfigs = await invoiceGeneratorService.listInvoiceConfigs()
    const companyLogo = invoiceConfigs[0]?.company_logo || null

    if (isPickup) {
      // Pickup branch — no shipping address needed.
      await notificationModuleService.createNotifications({
        to: order.email,
        channel: 'email',
        template: EmailTemplates.PICKUP_COMPLETED,
        data: {
          emailOptions: {
            replyTo: 'office@strickerei-jutta.at',
            subject: 'Vielen Dank für Ihre Abholung',
          },
          order,
          companyLogo,
          preview: 'Wir haben Ihre Bestellung an Sie übergeben.',
        },
      })
      logger.info(`[ShipmentDelivered] Pickup-completed notification sent for order ${orderId}`)
      return
    }

    // Delivery branch — original behavior, byte-equivalent to pre-change.
    const shippingAddress = await (orderModuleService as any).orderAddressService_.retrieve(order.shipping_address.id)
    logger.debug(`[ShipmentDelivered] Shipping address loaded`)

    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.SHIPMENT_DELIVERED,
      data: {
        emailOptions: {
          replyTo: 'office@strickerei-jutta.at',
          subject: 'Zustellung'
        },
        order,
        shippingAddress,
        companyLogo,
        preview: 'Ihre Bestellung wurde zugestellt.'
      }
    })
    logger.info(`[ShipmentDelivered] Delivery notification sent successfully for order ${orderId}`)
  } catch (error) {
    logger.error(`[ShipmentDelivered] Error sending delivery notification for fulfillment ${data.id}:`, error)
    // Don't throw - subscribers should never throw errors
  }
}

export const config: SubscriberConfig = {
  event: 'delivery.created'
}
