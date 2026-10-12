import { createHash } from "crypto"

/**
 * Builds the Conversions API "Purchase" for an order.
 * - Only orders whose cart carries the storefront's attribution (written
 *   right before payment, and only with "marketing" consent) are sent.
 * - event_id = order id, the same eventID the browser pixel sends on the
 *   confirmation page, so Meta counts the purchase once.
 * - content ids and value match the pixel (variant SKU, else variant id;
 *   order total in EUR, Medusa amounts are already in euros).
 * - Contact data is normalised and SHA-256 hashed as Meta requires; street
 *   and house number are never sent (privacy page, section 8).
 */

// Key on cart.metadata (copied to order.metadata by Medusa on completion)
export const ATTRIBUTION_KEY = "meta_capi"

const MAX_LENGTH = { ip: 64, cookie: 256, userAgent: 512, url: 1024 }

// Calling codes for numbers written without one ("0664 …")
const CALLING_CODES: Record<string, string> = { at: "43", de: "49", ch: "41" }
const DEFAULT_CALLING_CODE = CALLING_CODES.at
const TRUNK_ZERO = new RegExp(`^(${Object.values(CALLING_CODES).join("|")})0`)

export type Attribution = {
  fbp?: string
  fbc?: string
  client_ip_address?: string
  client_user_agent?: string
  event_source_url: string
}

type Address = {
  first_name?: string | null
  last_name?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
  phone?: string | null
} | null

// Medusa hands amounts and quantities over as BigNumber objects: Number()
type Numeric = number | { valueOf(): number }

type OrderItem = {
  quantity: Numeric
  unit_price: Numeric
  variant_sku?: string | null
  variant_id?: string | null
  product_id?: string | null
  title: string
}

export type PurchaseOrder = {
  id: string
  email?: string | null
  currency_code: string
  total: Numeric
  created_at: string | Date
  customer_id?: string | null
  items: OrderItem[]
  billing_address?: Address
  shipping_address?: Address
}

export type MetaServerEvent = {
  event_name: string
  event_time: number
  event_id: string
  action_source: "website"
  event_source_url: string
  user_data: Record<string, string | string[]>
  custom_data: Record<string, unknown>
}

const text = (value: unknown, max: number): string | undefined =>
  typeof value === "string" && value.trim() && value.length <= max
    ? value.trim()
    : undefined

/** The storefront's attribution, if the cart was saved with consent */
export function readAttribution(metadata: unknown): Attribution | null {
  const raw = (metadata as Record<string, unknown> | null)?.[ATTRIBUTION_KEY]
  if (!raw || typeof raw !== "object") return null
  const value = raw as Record<string, unknown>
  if (value.consent !== true) return null

  const url = text(value.event_source_url, MAX_LENGTH.url)
  if (!url || !/^https?:\/\//.test(url)) return null

  return {
    event_source_url: url,
    fbp: text(value.fbp, MAX_LENGTH.cookie),
    fbc: text(value.fbc, MAX_LENGTH.cookie),
    client_ip_address: text(value.client_ip_address, MAX_LENGTH.ip),
    client_user_agent: text(value.client_user_agent, MAX_LENGTH.userAgent),
  }
}

const sha256 = (value: string) =>
  createHash("sha256").update(value, "utf8").digest("hex")

// Lower case, letters only (umlauts stay, Meta takes UTF-8)
const lettersOnly = (value?: string | null) =>
  value?.toLowerCase().replace(/[^\p{L}]/gu, "") || undefined

function normalizeEmail(email?: string | null): string | undefined {
  const value = email?.trim().toLowerCase()
  return value && value.includes("@") ? value : undefined
}

// Digits with calling code, no leading zeros: "0664 123" → "43664123"
function normalizePhone(
  phone?: string | null,
  countryCode?: string | null
): string | undefined {
  if (!phone) return undefined
  const digits = phone.replace(/\D/g, "")
  const callingCode =
    CALLING_CODES[countryCode?.toLowerCase() ?? ""] ?? DEFAULT_CALLING_CODE
  const full = phone.trim().startsWith("+")
    ? digits
    : digits.startsWith("00")
    ? digits.slice(2)
    : digits.startsWith("0")
    ? callingCode + digits.slice(1)
    : digits
  // "+43 (0)664 …": no trunk zero after the calling code
  const withoutTrunkZero = full.replace(TRUNK_ZERO, "$1")
  return withoutTrunkZero.length >= 7 ? withoutTrunkZero : undefined
}

function hashedUserData(order: PurchaseOrder): Record<string, string[]> {
  const address = order.billing_address ?? order.shipping_address ?? null
  const phone = order.billing_address?.phone || order.shipping_address?.phone
  const country = address?.country_code?.toLowerCase()
  const fields: Record<string, string | undefined> = {
    em: normalizeEmail(order.email),
    ph: normalizePhone(phone, country),
    fn: lettersOnly(address?.first_name),
    ln: lettersOnly(address?.last_name),
    ct: lettersOnly(address?.city),
    st: lettersOnly(address?.province),
    zp: address?.postal_code?.toLowerCase().replace(/\s/g, "") || undefined,
    country: country && /^[a-z]{2}$/.test(country) ? country : undefined,
    external_id: order.customer_id || undefined,
  }

  return Object.fromEntries(
    Object.entries(fields)
      .filter((entry): entry is [string, string] => !!entry[1])
      .map(([key, value]) => [key, [sha256(value)]])
  )
}

// Same id as the pixel (storefront lineItemToItem)
const contentId = (item: OrderItem) =>
  item.variant_sku || item.variant_id || item.product_id || item.title

export function buildPurchaseEvent(
  order: PurchaseOrder,
  attribution: Attribution
): MetaServerEvent {
  const items = order.items ?? []
  const { event_source_url, ...browser } = attribution

  return {
    event_name: "Purchase",
    event_time: Math.floor(new Date(order.created_at).getTime() / 1000),
    event_id: order.id,
    action_source: "website",
    event_source_url,
    user_data: {
      ...hashedUserData(order),
      ...Object.fromEntries(
        Object.entries(browser).filter(([, value]) => !!value)
      ),
    } as Record<string, string | string[]>,
    custom_data: {
      currency: order.currency_code.toUpperCase(),
      value: Number(order.total),
      order_id: order.id,
      content_type: "product",
      content_ids: items.map(contentId),
      contents: items.map((item) => ({
        id: contentId(item),
        quantity: Number(item.quantity),
        item_price: Number(item.unit_price),
      })),
      num_items: items.reduce((sum, item) => sum + Number(item.quantity), 0),
    },
  }
}
