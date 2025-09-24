import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService, IFulfillmentModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function shipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService = container.resolve(Modules.ORDER)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  
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
  console.log(`Fulfillment ${data.id} is for order ${orderId}`)

  // Retrieve order with relations
  const order = await orderModuleService.retrieveOrder(orderId, { 
    relations: ['items', 'summary', 'shipping_address'] 
  })
  console.log('order data:', order)

  // Retrieve shipping address
  const shippingAddress = await (orderModuleService as any).orderAddressService_.retrieve(
    order.shipping_address.id
  )
  console.log('shippingAddress data:', shippingAddress)

  // ⚠️ WICHTIG: Fulfillment-Daten abrufen!
  const fulfillment = await fulfillmentModuleService.retrieveFulfillment(data.id, {
    relations: ['items', 'delivery_address', 'labels']
  })
  console.log('fulfillment data:', fulfillment)

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.SHIPMENT_SENT,
      data: {
        emailOptions: {
          replyTo: 'office@strickerei-jutta.at',
          subject: 'Ihre Bestellung wurde versandt.'
        },
        order,
        fulfillment,  // ← Jetzt wird es übergeben!
        shippingAddress,
        preview: 'Vielen Dank für die Bestellung!'
      }
    })
    console.log('Shipment notification sent successfully')
  } catch (error) {
    console.error('Error sending fulfillment notification:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'shipment.created'
}