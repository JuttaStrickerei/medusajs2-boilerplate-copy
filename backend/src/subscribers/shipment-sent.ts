import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService, IFulfillmentModuleService, Logger } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { generateInvoicePdfWorkflow } from "../workflows/generate-invoice-pdf"
import { INVOICE_MODULE } from "../modules/invoice_generator"
import InvoiceGeneratorService from "../modules/invoice_generator/service"

export default async function shipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve("logger") as Logger
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService = container.resolve(Modules.ORDER)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  
  logger.info(`[ShipmentSent] Processing fulfillment: ${data.id}`)

  // Resolve the query directly from the container parameter
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  
  try {
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
      logger.warn(`[ShipmentSent] No order_fulfillment found for fulfillment ${data.id}`)
      return
    }

    // The order ID will be available in order_fulfillment[0].order_id
    const orderId = order_fulfillment[0].order_id
    logger.info(`[ShipmentSent] Fulfillment ${data.id} is for order ${orderId}`)

    // Retrieve order with relations
    const order = await orderModuleService.retrieveOrder(orderId, { 
      relations: ['items', 'summary', 'shipping_address'] 
    })
    logger.debug(`[ShipmentSent] Order data loaded for order ${orderId}`)

    // Null-check for shipping_address
    if (!order.shipping_address?.id) {
      logger.warn(`[ShipmentSent] No shipping address for order ${orderId}`)
    }
    
    // Retrieve shipping address (with null-safety)
    const shippingAddress = order.shipping_address?.id
      ? await (orderModuleService as any).orderAddressService_.retrieve(order.shipping_address.id)
      : order.shipping_address || null
    logger.debug(`[ShipmentSent] Shipping address loaded`)

    // Fulfillment-Daten abrufen
    const fulfillment = await fulfillmentModuleService.retrieveFulfillment(data.id, {
      relations: ['items', 'delivery_address', 'labels']
    })
    logger.debug(`[ShipmentSent] Fulfillment data loaded`)

    // Get company logo from invoice config
    const invoiceGeneratorService = container.resolve(INVOICE_MODULE) as InvoiceGeneratorService
    const invoiceConfigs = await invoiceGeneratorService.listInvoiceConfigs()
    const companyLogo = invoiceConfigs[0]?.company_logo || null

    // PDF-Rechnung generieren
    const { result: { pdf_buffer } } = await generateInvoicePdfWorkflow(container)
      .run({
        input: {
          order_id: orderId,
        },
      })
    
    const buffer = Buffer.from(pdf_buffer)
    const base64Content = buffer.toString("base64")

    // E-Mail mit PDF-Anhang senden
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
        fulfillment,
        shippingAddress,
        companyLogo,
        preview: 'Vielen Dank für die Bestellung!'
      },
      attachments: [
        {
          content: base64Content,
          filename: `invoice-${order.display_id}.pdf`,
          content_type: "application/pdf",
          disposition: "attachment",
        },
      ],
    })
    logger.info(`[ShipmentSent] Shipment notification with invoice PDF sent successfully for order ${orderId}`)
  } catch (error) {
    logger.error(`[ShipmentSent] Error sending fulfillment notification with PDF for fulfillment ${data.id}:`, error)
    // Don't throw - subscribers should never throw errors
  }
}

export const config: SubscriberConfig = {
  event: 'shipment.created'
}