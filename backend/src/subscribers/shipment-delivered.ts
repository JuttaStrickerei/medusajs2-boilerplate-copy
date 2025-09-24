import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService, IFulfillmentModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function fulfillmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService = container.resolve(Modules.ORDER)
  
  console.log('the data.id is', data.id)

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

  // The order ID will be available in order_fulfillment[0].order_id
  const orderId = order_fulfillment[0].order_id
  console.log(`Delivery ${data.id} is for order ${orderId}`)

  const order = await orderModuleService.retrieveOrder(orderId, { relations: ['items', 'summary', 'shipping_address'] })
  console.log('order data:', order)
  
  const shippingAddress = await (orderModuleService as any).orderAddressService_.retrieve(order.shipping_address.id)
  console.log('shippingAddress data:', shippingAddress)

  try {
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
        preview: 'Ihre Bestellung wurde zugestellt.'
      }
    })
  } catch (error) {
    console.error('Error sending delivery notification:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'delivery.created'
}