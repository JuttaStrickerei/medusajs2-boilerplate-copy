import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { META_CAPI_MODULE } from "../modules/meta-capi"
import MetaCapiModuleService from "../modules/meta-capi/service"
import {
  buildPurchaseEvent,
  readAttribution,
  type PurchaseOrder,
} from "../modules/meta-capi/purchase-event"
import { clearMetaAttributionWorkflow } from "../workflows/clear-meta-attribution"
import { WELCOME_CODE_PREFIX } from "../workflows/create-welcome-promotion"
import {
  HERKUNFT_KEY,
  orderHerkunft,
  readStoredHerkunft,
  usableFbc,
  clearHerkunftUpdate,
  type StoredHerkunft,
} from "../lib/herkunft"

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

type Logger = {
  info: (msg: string) => void
  warn: (msg: string) => void
  error: (msg: string) => void
}

type SignupHerkunft = {
  promotionId: string
  code: string
  herkunft: StoredHerkunft
}

// Herkunft am eingelösten Willkommens-Code (lib/herkunft). Own small query:
// the order query above must stay as it is.
async function findSignupHerkunft(
  query: { graph: (args: any) => Promise<{ data: any[] }> },
  orderId: string,
  logger: Logger
): Promise<SignupHerkunft | null> {
  try {
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "promotions.id", "promotions.code", "promotions.metadata"],
      filters: { id: orderId },
    })
    for (const promotion of order?.promotions ?? []) {
      if (!promotion?.code?.startsWith(WELCOME_CODE_PREFIX)) continue
      const herkunft = readStoredHerkunft(promotion.metadata)
      if (herkunft) {
        return {
          promotionId: promotion.id,
          code: promotion.code,
          herkunft,
        }
      }
    }
  } catch (error) {
    logger.warn(
      `[Herkunft] Promotions of order ${orderId} not read: ${(error as Error).message}`
    )
  }
  return null
}

/**
 * Reports the purchase to Meta (Conversions API), also when the shopper
 * never reaches the confirmation page (Klarna, PayPal, EPS redirects).
 * Only orders with the storefront's attribution count: it is written only
 * with "marketing" consent. Afterwards the attribution is deleted from the
 * order and the cart, also when the module is off (no access token) or Meta
 * refused the event.
 *
 * Paid with a newsletter welcome code that carries a Herkunft (the ad she came
 * from when she signed up, maybe in another browser): the order gets a summary
 * of it (metadata.herkunft), and the Meta event gets the click id from the
 * signup when this browser has none. The Herkunft is then deleted at the code.
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
  if (!order) return

  const signup = await findSignupHerkunft(query, order.id, logger)
  const attribution = readAttribution(order?.metadata)
  if (!attribution && !signup) return

  // Klick aus der Anmeldung nur, wenn dieser Browser keinen eigenen hat (der neuere zählt)
  if (attribution && signup) {
    const signupFbc = usableFbc(signup.herkunft, new Date(order.created_at))
    if (!attribution.fbc && signupFbc) attribution.fbc = signupFbc
    if (!attribution.fbp && signup.herkunft.fbp) attribution.fbp = signup.herkunft.fbp
  }

  const result: Record<string, string> = !attribution
    ? {}
    : container.hasRegistration(META_CAPI_MODULE)
      ? await sendPurchase(container.resolve(META_CAPI_MODULE), order, attribution, logger)
      : { meta_capi_skipped: "module off" }

  try {
    await clearMetaAttributionWorkflow(container).run({
      input: {
        order_id: order.id,
        cart_id: order.cart?.id,
        result,
        ...(signup
          ? { extra: { [HERKUNFT_KEY]: orderHerkunft(signup.herkunft, signup.code) } }
          : {}),
      },
    })
  } catch (error) {
    logger.error(
      `[MetaCapi] Attribution of order ${order.id} not deleted: ${(error as Error).message}`
    )
  }

  if (signup) {
    try {
      await container
        .resolve(Modules.PROMOTION)
        .updatePromotions([clearHerkunftUpdate(signup.promotionId)])
      logger.info(`[Herkunft] Order ${order.id} linked to its newsletter signup`)
    } catch (error) {
      logger.error(
        `[Herkunft] Herkunft at promotion ${signup.promotionId} not deleted: ${(error as Error).message}`
      )
    }
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
