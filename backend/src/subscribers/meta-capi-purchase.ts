import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { META_CAPI_MODULE } from "../modules/meta-capi"
import MetaCapiModuleService from "../modules/meta-capi/service"
import {
  buildPurchaseEvent,
  readAttribution,
  type PurchaseOrder,
} from "../modules/meta-capi/purchase-event"
import { HERKUNFT_MODULE } from "../modules/herkunft"
import type HerkunftModuleService from "../modules/herkunft/service"
import { clearMetaAttributionWorkflow } from "../workflows/clear-meta-attribution"
import { WELCOME_CODE_PREFIX } from "../workflows/create-welcome-promotion"
import {
  HERKUNFT_KEY,
  orderHerkunft,
  pickFbc,
  readStoredHerkunft,
  shortError,
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

type Query = { graph: (args: any) => Promise<{ data: any[] }> }

type SignupHerkunft = {
  entryId: string
  code: string
  herkunft: StoredHerkunft
}

// Herkunft zum eingelösten Willkommens-Code (Modul herkunft). Own small query:
// the order query above must stay as it is.
async function findSignupHerkunft(
  container: MedusaContainer,
  query: Query,
  orderId: string,
  logger: Logger
): Promise<SignupHerkunft | null> {
  try {
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "promotions.code"],
      filters: { id: orderId },
    })
    const codes: string[] = (order?.promotions ?? [])
      .map((promotion: { code?: string | null }) => promotion?.code)
      .filter((code: unknown): code is string =>
        typeof code === "string" && code.startsWith(WELCOME_CODE_PREFIX)
      )
    if (!codes.length) return null

    const herkunftModule: HerkunftModuleService = container.resolve(HERKUNFT_MODULE)
    const entries = await herkunftModule.listNewsletterHerkunfts({ code: codes })
    for (const entry of entries) {
      const herkunft = readStoredHerkunft(entry.data)
      if (herkunft) return { entryId: entry.id, code: entry.code, herkunft }
    }
  } catch (error) {
    logger.warn(
      `[Herkunft] Signup of order ${orderId} not read: ${shortError(error)}`
    )
  }
  return null
}

// Other code also merges into order.metadata, e.g. save-order-source when the
// survey on the thank-you page is answered right away. Medusa merges in the
// application (read, merge, write), so an update running at the same moment can
// drop our key. Each update takes milliseconds: after a short wait any
// overlapping one has committed, then read once more and write again if needed.
const SETTLE_MS = 1500
const settle = () => new Promise((resolve) => setTimeout(resolve, SETTLE_MS))

async function orderShowsHerkunft(query: Query, orderId: string): Promise<boolean> {
  await settle()
  const {
    data: [order],
  } = await query.graph({ entity: "order", fields: ["id", "metadata"], filters: { id: orderId } })
  return !!(order?.metadata as Record<string, unknown> | null)?.[HERKUNFT_KEY]
}

/**
 * Reports the purchase to Meta (Conversions API), also when the shopper
 * never reaches the confirmation page (Klarna, PayPal, EPS redirects).
 * Only orders with the storefront's attribution count: it is written only
 * with "marketing" consent. Afterwards the attribution is deleted from the
 * order and the cart, also when the module is off (no access token) or Meta
 * refused the event.
 *
 * Paid with a newsletter welcome code that has a Herkunft (the ad she came
 * from when she signed up, maybe in another browser): the order gets a summary
 * of it (metadata.herkunft), and the Meta event gets the click id from the
 * signup when it is newer than this browser's own (at most 7 days old). The
 * Herkunft entry is deleted once the order shows the summary.
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

  const signup = await findSignupHerkunft(container, query, order.id, logger)
  const stored = readAttribution(order.metadata)
  if (!stored && !signup) return

  const attribution =
    stored && signup
      ? {
          ...stored,
          fbc: pickFbc(stored.fbc, signup.herkunft, new Date(order.created_at)),
        }
      : stored

  const result: Record<string, string> = !attribution
    ? {}
    : container.hasRegistration(META_CAPI_MODULE)
      ? await sendPurchase(container.resolve(META_CAPI_MODULE), order, attribution, logger)
      : { meta_capi_skipped: "module off" }

  const input = {
    order_id: order.id,
    cart_id: order.cart?.id,
    result,
    ...(signup
      ? { extra: { [HERKUNFT_KEY]: orderHerkunft(signup.herkunft, signup.code) } }
      : {}),
  }
  try {
    await clearMetaAttributionWorkflow(container).run({ input })
  } catch (error) {
    logger.error(
      `[MetaCapi] Attribution of order ${order.id} not deleted: ${(error as Error).message}`
    )
  }

  if (!signup) return
  try {
    if (!(await orderShowsHerkunft(query, order.id))) {
      await clearMetaAttributionWorkflow(container).run({ input })
    }
    if (!(await orderShowsHerkunft(query, order.id))) {
      // Eintrag bleibt, der Job löscht ihn nach Ablauf des Codes
      logger.error(`[Herkunft] Order ${order.id} does not show its Herkunft`)
      return
    }
    const herkunftModule: HerkunftModuleService = container.resolve(HERKUNFT_MODULE)
    await herkunftModule.deleteNewsletterHerkunfts([signup.entryId])
    logger.info(`[Herkunft] Order ${order.id} linked to its newsletter signup`)
  } catch (error) {
    logger.error(
      `[Herkunft] Herkunft of order ${order.id} not finished: ${shortError(error)}`
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
