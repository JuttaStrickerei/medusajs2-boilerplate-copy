import { Modules } from '@medusajs/framework/utils'
import { Logger } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { generateInvoicePdfWorkflow } from '../workflows/generate-invoice-pdf'
import { INVOICE_MODULE } from '../modules/invoice_generator'
import InvoiceGeneratorService from '../modules/invoice_generator/service'

type FulfillmentCreatedPayload = {
  order_id: string
  fulfillment_id: string
  no_notification?: boolean
}

const PICKUP_LOCATION_FALLBACK =
  "Strickerei Jutta\nWr. Neustädterstraße 47\n7021 Gemeinde Draßburg\nÖsterreich"

export default async function pickupReadyHandler({
  event: { data },
  container,
}: SubscriberArgs<FulfillmentCreatedPayload>) {
  const logger = container.resolve("logger") as Logger
  logger.info(
    `[PickupReady] Processing fulfillment: ${data.fulfillment_id} for order: ${data.order_id}`
  )

  if (data.no_notification === true) {
    logger.info(`[PickupReady] no_notification flag set, skipping`)
    return
  }

  try {
    const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any
    const orderModuleService = container.resolve(Modules.ORDER)
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    const fulfillment = await fulfillmentService.retrieveFulfillment(
      data.fulfillment_id
    )
    if (fulfillment?.requires_shipping !== false) {
      logger.info(
        `[PickupReady] Not a pickup fulfillment (requires_shipping=${fulfillment?.requires_shipping}), skipping`
      )
      return
    }

    const order = await orderModuleService.retrieveOrder(data.order_id, {
      relations: ['items', 'summary'],
    })

    const invoiceGeneratorService = container.resolve(
      INVOICE_MODULE
    ) as InvoiceGeneratorService
    const invoiceConfigs = await invoiceGeneratorService.listInvoiceConfigs()
    const companyLogo = invoiceConfigs[0]?.company_logo || null
    const pickupLocation = PICKUP_LOCATION_FALLBACK

    // Invoice PDF — RESILIENT: if generation fails, send the email anyway.
    // Customer must always get the "ready for pickup" message.
    let attachments:
      | Array<{
          content: string
          filename: string
          content_type: string
          disposition: string
        }>
      | undefined
    try {
      const {
        result: { pdf_buffer },
      } = await generateInvoicePdfWorkflow(container).run({
        input: { order_id: data.order_id },
      })
      const buffer = Buffer.from(pdf_buffer)
      attachments = [
        {
          content: buffer.toString("base64"),
          filename: `invoice-${order.display_id}.pdf`,
          content_type: "application/pdf",
          disposition: "attachment",
        },
      ]
      logger.debug(
        `[PickupReady] Invoice PDF generated for order ${data.order_id}`
      )
    } catch (pdfError) {
      logger.error(
        `[PickupReady] Invoice PDF generation failed for order ${data.order_id}, sending email without attachment:`,
        pdfError
      )
      // Intentionally fall through — email still goes out without the invoice.
    }

    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.PICKUP_READY,
      data: {
        emailOptions: {
          replyTo: 'office@strickerei-jutta.at',
          subject: 'Ihre Bestellung ist abholbereit',
        },
        order,
        companyLogo,
        pickupLocation,
        preview: 'Ihre Bestellung wartet im Shop auf Sie.',
      },
      ...(attachments ? { attachments } : {}),
    })
    logger.info(
      `[PickupReady] Pickup-ready notification sent for order ${data.order_id}` +
        (attachments
          ? " with invoice PDF"
          : " WITHOUT invoice PDF (PDF generation failed)")
    )
  } catch (error) {
    logger.error(
      `[PickupReady] Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    // Don't throw - subscribers should never throw errors
  }
}

export const config: SubscriberConfig = {
  event: 'order.fulfillment_created',
}
