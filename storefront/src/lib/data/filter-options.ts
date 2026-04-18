"use server"

import { HttpTypes } from "@medusajs/types"
import { getProductMinVariantPriceForFilter } from "@lib/util/variant-price-for-filter"
import { listProducts } from "./products"
import { listCategories } from "./categories"
import { listCollections } from "./collections"

export interface ColorOption {
  value: string
  label: string
  hex: string
}

export interface SizeOption {
  value: string
  label: string
}

export interface MaterialOption {
  value: string
  label: string
}

export interface PriceRangeOption {
  value: string
  label: string
  min: number
  max: number
}

export interface DynamicFilterOptions {
  colors: ColorOption[]
  sizes: SizeOption[]
  materials: MaterialOption[]
  priceRanges: PriceRangeOption[]
  categories: HttpTypes.StoreProductCategory[]
  collections: HttpTypes.StoreCollection[]
}

const COLOR_HEX_MAP: Record<string, string> = {
  schwarz: "#1a1a1a",
  weiß: "#ffffff",
  weiss: "#ffffff",
  grau: "#6b7280",
  beige: "#d4c4a8",
  braun: "#8b6f47",
  blau: "#2563eb",
  navy: "#1e3a5f",
  rot: "#dc2626",
  bordeaux: "#722f37",
  grün: "#16a34a",
  oliv: "#6b8e23",
  salbei: "#9caf88",
  gelb: "#eab308",
  rosa: "#f472b6",
  lila: "#a855f7",
  black: "#1a1a1a",
  white: "#ffffff",
  grey: "#6b7280",
  gray: "#6b7280",
  brown: "#8b6f47",
  blue: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
  olive: "#6b8e23",
  sage: "#9caf88",
  yellow: "#eab308",
  pink: "#f472b6",
  purple: "#a855f7",
  lilac: "#c084fc",
  kaschmir: "#e8dcc8",
  cashmere: "#e8dcc8",
  merino: "#f5f5dc",
  alpaka: "#d2b48c",
  alpaca: "#d2b48c",
}

const COLOR_OPTION_TITLES = ["color", "farbe", "colour"]
const SIZE_OPTION_TITLES = ["size", "größe", "groesse"]

const SIZE_SORT_ORDER: Record<string, number> = {
  xxs: 0, xs: 1, s: 2, m: 3, l: 4, xl: 5, xxl: 6, "2xl": 7, "3xl": 8,
  "34": 10, "36": 11, "38": 12, "40": 13, "42": 14, "44": 15, "46": 16, "48": 17,
}

function capitalize(str: string): string {
  if (!str) return str
  if (str.length <= 3 && /^[a-zA-Z]+$/.test(str)) return str.toUpperCase()
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getHexForColor(colorName: string): string {
  const hex = COLOR_HEX_MAP[colorName.toLowerCase()]
  if (hex) return hex

  // Generate a deterministic fallback color from the string
  let hash = 0
  for (let i = 0; i < colorName.length; i++) {
    hash = colorName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 45%, 55%)`
}

function extractColorsFromProducts(products: HttpTypes.StoreProduct[]): ColorOption[] {
  const colorSet = new Map<string, string>()

  for (const product of products) {
    const colorOption = product.options?.find(
      (o) => COLOR_OPTION_TITLES.includes(o.title?.toLowerCase() || "")
    )
    if (!colorOption?.values) continue

    for (const v of colorOption.values) {
      const val = v.value?.trim()
      if (val && !colorSet.has(val.toLowerCase())) {
        colorSet.set(val.toLowerCase(), val)
      }
    }
  }

  return Array.from(colorSet.entries()).map(([key, original]) => ({
    value: key,
    label: capitalize(original),
    hex: getHexForColor(key),
  }))
}

function extractSizesFromProducts(products: HttpTypes.StoreProduct[]): SizeOption[] {
  const sizeSet = new Map<string, string>()

  for (const product of products) {
    const sizeOption = product.options?.find(
      (o) => SIZE_OPTION_TITLES.includes(o.title?.toLowerCase() || "")
    )
    if (!sizeOption?.values) continue

    for (const v of sizeOption.values) {
      const val = v.value?.trim()
      if (val && !sizeSet.has(val.toLowerCase())) {
        sizeSet.set(val.toLowerCase(), val)
      }
    }
  }

  return Array.from(sizeSet.entries())
    .map(([key, original]) => ({
      value: key,
      label: capitalize(original),
    }))
    .sort((a, b) => {
      const orderA = SIZE_SORT_ORDER[a.value] ?? 100
      const orderB = SIZE_SORT_ORDER[b.value] ?? 100
      if (orderA !== orderB) return orderA - orderB
      return a.value.localeCompare(b.value)
    })
}

/**
 * Strips a leading percentage from a material string.
 * Handles: "100%Viskose", "20% Polyester", " 30% Polyester", "5 % Elasthan"
 * Always trims whitespace first so the regex anchor ^ works correctly.
 */
function stripMaterialPercentage(raw: string): string {
  return raw.trim().replace(/^\d+\s*%\s*/, "").trim()
}

function extractMaterialsFromProducts(products: HttpTypes.StoreProduct[]): MaterialOption[] {
  const materialSet = new Map<string, string>()

  for (const product of products) {
    const materialValue = product.material as string | undefined
    if (!materialValue?.trim()) continue

    // Split comma-separated materials and strip leading percentage
    const parts = materialValue.split(",").map((p) => stripMaterialPercentage(p)).filter(Boolean)

    for (const part of parts) {
      const key = part.toLowerCase()
      if (!materialSet.has(key)) {
        materialSet.set(key, part)
      }
    }
  }

  return Array.from(materialSet.entries())
    .map(([key, original]) => ({
      value: key,
      label: capitalize(original),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "de"))
}

/** EUR thresholds — calculated_amount is in full euros (e.g. 154 = €154,00). */
const EUR_100 = 100
const EUR_150 = 150

const FIXED_PRICE_RANGE_DEFS: PriceRangeOption[] = [
  { value: "bis-100", label: "Bis 100€", min: 0, max: EUR_100 },
  { value: "bis-150", label: "Bis 150€", min: 0, max: EUR_150 },
  { value: "uber-150", label: "Über 150€", min: EUR_150 + 0.01, max: Infinity },
]

function productMatchesPriceRangeOption(
  product: HttpTypes.StoreProduct,
  range: PriceRangeOption
): boolean {
  const minPrice = getProductMinVariantPriceForFilter(product)
  if (minPrice === null) return false
  if (range.max === Infinity) {
    return minPrice >= range.min
  }
  // Use inclusive upper bound so products at exactly the boundary are included
  return minPrice >= range.min && minPrice <= range.max
}

function computePriceRanges(products: HttpTypes.StoreProduct[]): PriceRangeOption[] {
  const hasAnyPricedProduct = products.some(
    (p) => getProductMinVariantPriceForFilter(p) !== null
  )
  if (!hasAnyPricedProduct) return []

  return FIXED_PRICE_RANGE_DEFS.filter((range) =>
    products.some((p) => productMatchesPriceRangeOption(p, range))
  )
}

export interface FilterScope {
  categoryId?: string
  collectionId?: string
}

export async function getProductFilterOptions(
  countryCode: string,
  scope?: FilterScope
): Promise<DynamicFilterOptions> {
  const productQuery: Record<string, unknown> = {
    limit: 100,
    fields: "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags,+collection_id",
  }

  if (scope?.categoryId) {
    productQuery.category_id = [scope.categoryId]
  }
  if (scope?.collectionId) {
    productQuery.collection_id = [scope.collectionId]
  }

  const [productsResult, allCategories, collectionsResult] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: productQuery,
    }),
    listCategories({ limit: 100 }),
    listCollections({ limit: "100" }),
  ])

  const products = productsResult.response.products
  let categories = allCategories.filter((c) => !c.parent_category)
  let collections = collectionsResult.collections

  if (scope?.categoryId) {
    // On a category page: only show collections that actually contain products in this category
    const productCollectionIds = new Set(
      products.map((p: any) => p.collection_id).filter(Boolean)
    )
    collections = collections.filter((c) => productCollectionIds.has(c.id))
  }

  if (scope?.collectionId) {
    // On a collection page: only show categories that have products in this collection
    const productCategoryIds = new Set(
      products.flatMap((p: any) => (p.categories || []).map((c: any) => c.id))
    )
    if (productCategoryIds.size > 0) {
      categories = categories.filter((c) => productCategoryIds.has(c.id))
    }
  }

  return {
    colors: extractColorsFromProducts(products),
    sizes: extractSizesFromProducts(products),
    materials: extractMaterialsFromProducts(products),
    priceRanges: computePriceRanges(products),
    categories,
    collections,
  }
}
