import { HttpTypes } from "@medusajs/types"
import { BRAND } from "./analytics"
import { getPricesForVariant } from "./get-product-price"

/**
 * Product feed (Google Merchant RSS 2.0; the Meta catalog reads the same).
 * One item per variant, with the ids the Meta Pixel and the Conversions API
 * send (analytics.ts): id = variant SKU, else variant id; item_group_id =
 * product id. Only what the shop sells: the Store API already leaves out
 * drafts (sold-out and store-only pieces), and a variant is "out_of_stock"
 * exactly when the product page shows "Ausverkauft".
 * Feed titles are written for search ("Damen Strickmantel ROUGA aus
 * Merinowolle – Marine, L"); the shop itself keeps its own product names.
 */

export type FeedItem = Record<string, string | string[]>
// "google": image links for the Merchant Center, see feedImageUrl
export type FeedChannel = "google" | undefined

const COLOR_OPTIONS = ["farbe", "farben", "color", "colour"]
const SIZE_OPTIONS = ["größe", "groesse", "size"]
// Each image is converted to JPEG on request (api/feeds/image), so few
const MAX_ADDITIONAL_IMAGES = 5
const MAX_DESCRIPTION_LENGTH = 5000
const MAX_MATERIAL_LENGTH = 200
const MAX_TITLE_LENGTH = 150

// custom_label_0: the collection as a short season code, for campaigns and
// product sets per season (Google Shopping, Meta catalog)
const SEASON_LABELS: Record<string, string> = {
  "herbst/winter 2026": "HW26",
  "frühjahr/sommer 2026": "FS26",
}

// custom_label_1: price band, to bid on cheap and expensive pieces separately
const PRICE_BANDS: [number, string][] = [
  [100, "unter 100"],
  [150, "100 bis 149"],
]
const TOP_PRICE_BAND = "ab 150"

// Google product categories as English paths (Google and Meta accept them).
// Checked against "title + category" in this order, first match wins.
const GOOGLE_CATEGORIES: [RegExp, string][] = [
  [/schal/i, "Apparel & Accessories > Clothing Accessories > Scarves & Shawls"],
  [/weste/i, "Apparel & Accessories > Clothing > Outerwear > Vests"],
  [
    /mantel|mäntel|jacke|blazer/i,
    "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets",
  ],
  [/poncho/i, "Apparel & Accessories > Clothing > Outerwear"],
  [/hose/i, "Apparel & Accessories > Clothing > Pants"],
  [/rock|röcke/i, "Apparel & Accessories > Clothing > Skirts"],
  [/kleid/i, "Apparel & Accessories > Clothing > Dresses"],
  [
    /pullover|oberteil|top|tunika|shirt/i,
    "Apparel & Accessories > Clothing > Shirts & Tops",
  ],
]
const DEFAULT_GOOGLE_CATEGORY = "Apparel & Accessories > Clothing"

// Same rule as the product page (modules/products/hooks/use-variant-selection.ts)
function isAvailable(variant: HttpTypes.StoreProductVariant): boolean {
  if (!variant.manage_inventory) return true
  if (variant.allow_backorder) return true
  return (variant.inventory_quantity || 0) > 0
}

function optionValue(
  product: HttpTypes.StoreProduct,
  variant: HttpTypes.StoreProductVariant,
  names: string[]
): string | undefined {
  const titles = new Map(
    (product.options ?? []).map((option) => [option.id, option.title])
  )
  const match = (variant.options ?? []).find((value) => {
    const title = value.option?.title ?? titles.get(value.option_id ?? "")
    return names.includes((title ?? "").trim().toLowerCase())
  })
  return match?.value || undefined
}

// Only the shop's own wording: "Strick" when the description says so, the
// fibre only when the piece is made of one ("100% Merinowolle")
const isKnitted = (description: string) => /strick/i.test(description)

function singleFibre(material?: string | null): string | undefined {
  const match = (material ?? "").trim().match(/^100\s*%\s*([A-Za-zÄÖÜäöüß -]+)$/)
  return match?.[1].trim() || undefined
}

function feedTitle(
  product: HttpTypes.StoreProduct,
  description: string,
  color?: string,
  size?: string
): string {
  // "Mantel ROUGA": the first word is the garment type, the rest its name
  const [type, ...name] = product.title.split(" ")
  const garment = isKnitted(description) ? `Strick${type.toLowerCase()}` : type
  const fibre = singleFibre(product.material)
  const base = ["Damen", garment, ...name, fibre ? `aus ${fibre}` : ""]
    .filter(Boolean)
    .join(" ")
  const variant = [color, size].filter(Boolean).join(", ")
  return (variant ? `${base} – ${variant}` : base).slice(0, MAX_TITLE_LENGTH)
}

function seasonLabel(product: HttpTypes.StoreProduct): string | undefined {
  const collection = product.collection?.title?.trim()
  if (!collection) return undefined
  return SEASON_LABELS[collection.toLowerCase()] ?? collection
}

const priceBand = (amount: number) =>
  PRICE_BANDS.find(([limit]) => amount < limit)?.[1] ?? TOP_PRICE_BAND

function googleCategory(title: string, categories: string[]): string {
  const text = [title, ...categories].join(" ")
  return (
    GOOGLE_CATEGORIES.find(([pattern]) => pattern.test(text))?.[1] ??
    DEFAULT_GOOGLE_CATEGORY
  )
}

const plainText = (html?: string | null) =>
  (html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()

// The bucket holds WebP, the Meta catalog only takes JPEG/PNG. Google's links
// always go through the route, which adds the "edited with AI" note.
const feedImageUrl = (url: string, baseUrl: string, channel: FeedChannel) =>
  channel || /\.(webp|avif)(\?|$)/i.test(url)
    ? `${baseUrl}/api/feeds/image?src=${encodeURIComponent(url)}${
        channel ? `&channel=${channel}` : ""
      }`
    : url

const formatPrice = (amount: number, currencyCode: string) =>
  `${amount.toFixed(2)} ${currencyCode.toUpperCase()}`

function images(
  product: HttpTypes.StoreProduct,
  variant: HttpTypes.StoreProductVariant,
  baseUrl: string,
  channel: FeedChannel
): { main?: string; additional: string[] } {
  const main =
    variant.thumbnail ||
    variant.images?.[0]?.url ||
    product.thumbnail ||
    product.images?.[0]?.url ||
    undefined
  // The variant's images are its colour plus the general ones
  const pool = variant.images?.length ? variant.images : product.images ?? []
  const additional = Array.from(new Set(pool.map((image) => image.url)))
    .filter((url): url is string => !!url && url !== main)
    .slice(0, MAX_ADDITIONAL_IMAGES)
  return {
    main: main && feedImageUrl(main, baseUrl, channel),
    additional: additional.map((url) => feedImageUrl(url, baseUrl, channel)),
  }
}

function variantToFeedItem(
  product: HttpTypes.StoreProduct,
  variant: HttpTypes.StoreProductVariant,
  baseUrl: string,
  countryCode: string,
  channel: FeedChannel
): FeedItem | null {
  const prices = getPricesForVariant(variant)
  const { main, additional } = images(product, variant, baseUrl, channel)
  if (!prices || !main) return null

  const color = optionValue(product, variant, COLOR_OPTIONS)
  const size = optionValue(product, variant, SIZE_OPTIONS)
  const categories = (product.categories ?? []).map((category) => category.name)
  const onSale =
    prices.price_type === "sale" &&
    prices.original_price_number > prices.calculated_price_number
  const description = (
    plainText(product.description) ||
    product.subtitle ||
    product.title
  ).slice(0, MAX_DESCRIPTION_LENGTH)
  const season = seasonLabel(product)

  return {
    "g:id": variant.sku || variant.id,
    "g:item_group_id": product.id,
    title: feedTitle(product, description, color, size),
    description,
    link: `${baseUrl}/${countryCode}/products/${product.handle}`,
    "g:image_link": main,
    "g:additional_image_link": additional,
    "g:availability": isAvailable(variant) ? "in_stock" : "out_of_stock",
    "g:price": formatPrice(
      onSale ? prices.original_price_number : prices.calculated_price_number,
      prices.currency_code
    ),
    ...(onSale
      ? {
          "g:sale_price": formatPrice(
            prices.calculated_price_number,
            prices.currency_code
          ),
        }
      : {}),
    "g:brand": BRAND,
    "g:condition": "new",
    // Own manufacture, no GTIN
    "g:identifier_exists": "no",
    "g:age_group": "adult",
    // Strickerei Jutta only sells women's clothing
    "g:gender": "female",
    ...(color ? { "g:color": color } : {}),
    ...(size ? { "g:size": size, "g:size_system": "EU" } : {}),
    ...(product.material
      ? { "g:material": product.material.slice(0, MAX_MATERIAL_LENGTH) }
      : {}),
    "g:google_product_category": googleCategory(product.title, categories),
    ...(categories[0] ? { "g:product_type": categories[0] } : {}),
    ...(season ? { "g:custom_label_0": season } : {}),
    "g:custom_label_1": priceBand(prices.calculated_price_number),
  }
}

/** Feed items for every variant with a price and an image */
export function productToFeedItems(
  product: HttpTypes.StoreProduct,
  baseUrl: string,
  countryCode: string,
  channel?: FeedChannel
): FeedItem[] {
  return (product.variants ?? [])
    .map((variant) =>
      variantToFeedItem(product, variant, baseUrl, countryCode, channel)
    )
    .filter((item): item is FeedItem => !!item)
}

const XML_ESCAPES: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
}

const escapeXml = (value: string) =>
  value
    // Control characters are not allowed in XML 1.0
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[<>&'"]/g, (char) => XML_ESCAPES[char])

const itemXml = (item: FeedItem) =>
  [
    "    <item>",
    ...Object.entries(item).flatMap(([tag, value]) =>
      (Array.isArray(value) ? value : [value]).map(
        (entry) => `      <${tag}>${escapeXml(entry)}</${tag}>`
      )
    ),
    "    </item>",
  ].join("\n")

export function feedXml(items: FeedItem[], baseUrl: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    `    <title>${escapeXml(BRAND)}</title>`,
    `    <link>${escapeXml(baseUrl)}</link>`,
    "    <description>Strickwaren aus der Strickerei Jutta</description>",
    ...items.map(itemXml),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n")
}
