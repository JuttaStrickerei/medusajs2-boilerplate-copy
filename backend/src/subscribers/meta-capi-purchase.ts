import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { META_CAPI_MODULE } from "../modules/meta-capi"
import MetaCapiModuleService from "../modules/meta-capi/service"
import {
  buildPurchaseEvent,
  readAttribution,
  type PurchaseOrder,
} from "../modules/meta-capi/purchase-event"
import { clearMetaAttributionWorkflow } from "../workflows/clear-meta-attribution"

// "total" is only computed with full items and shipping methods (as in the
// invoice workflow). Never traverse shipping_methods.shipping_option.* here
// (kills the query)
const ORDER_FIELDS = [
  "id",
  "email",
  "currency_code",
  "total",
  "created_at",
  "customer_id",
  "metadata",
  "cart.id",
  "items.*",
  "shipping_methods.*",
  "billing_address.*",
  "shipping_address.*",
]

/**
 * Reports the purchase to Meta (Conversions API), also when the shopper
 * never reaches the confirmation page (Klarna, PayPal, EPS redirects).
 * Only orders with the storefront's attribution count: it is written only
 * with "marketing" consent. Afterwards the attribution is deleted from the
 * order and the cart, also when the module is off (no access token) or Meta
 * refused the event.
 */
export default async function metaCapiPurchaseHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ORDER_FIELDS,
    filters: { id: data.id },
  })
  const attribution = readAttribution(order?.metadata)
  if (!order || !attribution) return

  const result = container.hasRegistration(META_CAPI_MODULE)
    ? await sendPurchase(container.resolve(META_CAPI_MODULE), order, attribution, logger)
    : { meta_capi_skipped: "module off" }

  try {
    await clearMetaAttributionWorkflow(container).run({
      input: { order_id: order.id, cart_id: order.cart?.id, result },
    })
  } catch (error) {
    logger.error(
      `[MetaCapi] Attribution of order ${order.id} not deleted: ${(error as Error).message}`
    )
  }
}

async function sendPurchase(
  metaCapi: MetaCapiModuleService,
  order: unknown,
  attribution: NonNullable<ReturnType<typeof readAttribution>>,
  logger: { info: (msg: string) => void; warn: (msg: string) => void }
): Promise<Record<string, string>> {
  const { id } = order as PurchaseOrder
  try {
    const received = await metaCapi.sendEvents([
      buildPurchaseEvent(order as PurchaseOrder, attribution),
    ])
    logger.info(
      `[MetaCapi] Purchase for order ${id} sent (received: ${received}${metaCapi.isTestMode ? ", test event" : ""})`
    )
    return { meta_capi_sent_at: new Date().toISOString() }
  } catch (error) {
    const message = (error as Error).message.slice(0, 200)
    logger.warn(`[MetaCapi] Purchase for order ${id} not sent: ${message}`)
    return { meta_capi_error: message }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
