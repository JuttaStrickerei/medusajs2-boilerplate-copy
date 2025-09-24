import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { generateInvoicePdfWorkflow } from "../workflows/generate-invoice-pdf"


export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const query = container.resolve("query")

  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  
  const order = await orderModuleService.retrieveOrder(data.id, { relations: ['items', 'summary', 'shipping_address'] })
  const shippingAddress = await (orderModuleService as any).orderAddressService_.retrieve(order.shipping_address.id)

   const { data: [order_pdf] } = await query.graph({
    entity: "order",
    fields: [
      "id", "display_id", "created_at", "currency_code", "total", "email",
      "items.*", "items.variant.*", "items.variant.product.*",
      "shipping_address.*", "billing_address.*", "shipping_methods.*",
      "tax_total", "subtotal", "discount_total",
      // Add any other order fields your email template might need...
    ],
    filters: {
      id: data.id,
    },
  })

  if (!order_pdf) {
    console.log(`Order with id: ${data.id} not found.`)
    return
  }

  try {
    const { result: { pdf_buffer } } = await generateInvoicePdfWorkflow(container)
      .run({
        input: {
          order_id: data.id,
        },
      })
   
    const buffer = Buffer.from(pdf_buffer)
    const base64Content = buffer.toString("base64")

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
      },
        attachments: [
        {
          content: base64Content,
          filename: `invoice-${order.display_id}.pdf`, // Use the user-friendly display_id
          content_type: "application/pdf",
          disposition: "attachment",
        },
      ],
    })
  } catch (error) {
    console.error('Error sending order confirmation notification:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed'
}
