"use server"

import { HttpTypes } from "@medusajs/types"
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
  gelb: "#eab308",
  rosa: "#f472b6",
  black: "#1a1a1a",
  white: "#ffffff",
  grey: "#6b7280",
  gray: "#6b7280",
  brown: "#8b6f47",
  blue: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
  yellow: "#eab308",
  pink: "#f472b6",
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

function extractMaterialsFromProducts(products: HttpTypes.StoreProduct[]): MaterialOption[] {
  const materialSet = new Map<string, string>()

  for (const product of products) {
    const materialValue = product.material as string | undefined
    if (!materialValue?.trim()) continue

    // Split comma-separated materials into individual entries
    const parts = materialValue.split(",").map((p) => p.trim()).filter(Boolean)

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

function computePriceRanges(products: HttpTypes.StoreProduct[]): PriceRangeOption[] {
  const prices: number[] = []

  for (const product of products) {
    if (!product.variants) continue
    for (const variant of product.variants) {
      const amount = variant.calculated_price?.calculated_amount
      if (amount !== undefined && amount !== null) {
        prices.push(amount)
      }
    }
  }

  if (prices.length === 0) return []

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  // Convert from cents to euros for range boundaries
  const minEuro = Math.floor(minPrice / 100)
  const maxEuro = Math.ceil(maxPrice / 100)

  if (maxEuro <= 0) return []

  // Generate sensible ranges based on actual price distribution
  const ranges: PriceRangeOption[] = []
  const step = maxEuro <= 100 ? 25 : maxEuro <= 300 ? 50 : 100

  let current = 0
  while (current < maxEuro) {
    const rangeEnd = Math.min(current + step, maxEuro + step)
    const isLast = rangeEnd >= maxEuro

    if (isLast && current > 0) {
      ranges.push({
        value: `${current}+`,
        label: `Über €${current}`,
        min: current * 100,
        max: Infinity,
      })
    } else {
      ranges.push({
        value: `${current}-${rangeEnd}`,
        label: current === 0 ? `Bis €${rangeEnd}` : `€${current} – €${rangeEnd}`,
        min: current * 100,
        max: rangeEnd * 100,
      })
    }
    current = rangeEnd
  }

  // Filter out ranges that contain no products
  return ranges.filter((range) =>
    prices.some((p) => p >= range.min && (range.max === Infinity ? true : p < range.max))
  )
}

export async function getProductFilterOptions(
  countryCode: string
): Promise<DynamicFilterOptions> {
  const [productsResult, allCategories, collectionsResult] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: {
        limit: 100,
        fields: "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags",
      },
    }),
    listCategories({ limit: 100 }),
    listCollections({ limit: "100" }),
  ])

  const products = productsResult.response.products

  return {
    colors: extractColorsFromProducts(products),
    sizes: extractSizesFromProducts(products),
    materials: extractMaterialsFromProducts(products),
    priceRanges: computePriceRanges(products),
    categories: allCategories.filter((c) => !c.parent_category),
    collections: collectionsResult.collections,
  }
}
