import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const IMAGE_COLUMN_COUNT = 10

interface ProductImage {
  id: string
  url: string
  rank?: number
}

interface VariantOption {
  id: string
  value: string
  option_id?: string
  option?: { id: string; title: string }
}

interface VariantPriceRule {
  attribute: string
  value: string
}

interface VariantPrice {
  amount: number
  currency_code: string
  price_rules?: VariantPriceRule[]
}

interface ProductVariant {
  id: string
  title: string
  sku?: string
  barcode?: string
  allow_backorder?: boolean
  manage_inventory?: boolean
  weight?: number
  length?: number
  width?: number
  height?: number
  hs_code?: string
  origin_country?: string
  mid_code?: string
  material?: string
  options?: VariantOption[]
  prices?: VariantPrice[]
}

interface ProductCategory {
  id: string
}

interface ProductTag {
  id: string
  value: string
}

interface SalesChannel {
  id: string
}

interface ProductData {
  id: string
  handle: string
  title: string
  subtitle?: string
  description?: string
  status: string
  thumbnail?: string
  weight?: number
  length?: number
  width?: number
  height?: number
  hs_code?: string
  origin_country?: string
  mid_code?: string
  material?: string
  collection_id?: string
  type_id?: string
  discountable?: boolean
  external_id?: string
  shipping_profile?: { id: string }
  images?: ProductImage[]
  variants?: ProductVariant[]
  options?: { id: string; title: string }[]
  categories?: ProductCategory[]
  tags?: ProductTag[]
  sales_channels?: SalesChannel[]
}

function escapeCsvField(
  value: string | number | boolean | null | undefined
): string {
  if (value === null || value === undefined || value === "") return ""
  const str = String(value)
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCsvRow(
  fields: (string | number | boolean | null | undefined)[]
): string {
  return fields.map(escapeCsvField).join(",")
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const allProducts: ProductData[] = []
  const pageSize = 200
  let page = 0

  while (true) {
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "handle",
        "title",
        "subtitle",
        "description",
        "status",
        "thumbnail",
        "weight",
        "length",
        "width",
        "height",
        "hs_code",
        "origin_country",
        "mid_code",
        "material",
        "collection_id",
        "type_id",
        "discountable",
        "external_id",
        "images.*",
        "variants.*",
        "variants.options.*",
        "variants.prices.*",
        "options.*",
        "categories.id",
        "tags.id",
        "tags.value",
        "sales_channels.id",
        "shipping_profile.id",
      ],
      pagination: {
        skip: page * pageSize,
        take: pageSize,
      },
    })

    allProducts.push(...(products as unknown as ProductData[]))
    if (products.length < pageSize) break
    page += 1
  }

  const maxCategories = Math.max(
    1,
    ...allProducts.map((p) => p.categories?.length ?? 0)
  )
  const maxTags = Math.max(
    1,
    ...allProducts.map((p) => p.tags?.length ?? 0)
  )
  const maxSalesChannels = Math.max(
    1,
    ...allProducts.map((p) => p.sales_channels?.length ?? 0)
  )
  const maxOptions = Math.max(
    1,
    ...allProducts.map((p) => p.options?.length ?? 0)
  )

  const allCurrencies = new Set<string>()
  for (const product of allProducts) {
    for (const variant of product.variants ?? []) {
      for (const price of variant.prices ?? []) {
        if (!price.price_rules?.length) {
          allCurrencies.add(price.currency_code.toUpperCase())
        }
      }
    }
  }
  const sortedCurrencies = [...allCurrencies].sort()

  const headers = [
    "Product Id",
    "Product Handle",
    "Product Title",
    "Product Subtitle",
    "Product Description",
    "Product Status",
    "Product Thumbnail",
    "Product Weight",
    "Product Length",
    "Product Width",
    "Product Height",
    "Product HS Code",
    "Product Origin Country",
    "Product MID Code",
    "Product Material",
    "Shipping Profile Id",
    ...Array.from(
      { length: maxSalesChannels },
      (_, i) => `Product Sales Channel ${i + 1}`
    ),
    "Product Collection Id",
    ...Array.from(
      { length: maxCategories },
      (_, i) => `Product Category ${i + 1} Id`
    ),
    "Product Type Id",
    ...Array.from({ length: maxTags }, (_, i) => `Product Tag ${i + 1}`),
    "Product Discountable",
    "Product External Id",
    "Variant Id",
    "Variant Title",
    "Variant SKU",
    "Variant Barcode",
    "Variant Allow Backorder",
    "Variant Manage Inventory",
    "Variant Weight",
    "Variant Length",
    "Variant Width",
    "Variant Height",
    "Variant HS Code",
    "Variant Origin Country",
    "Variant MID Code",
    "Variant Material",
    ...sortedCurrencies.map((c) => `Variant Price ${c}`),
    ...Array.from({ length: maxOptions }, (_, i) => [
      `Variant Option ${i + 1} Name`,
      `Variant Option ${i + 1} Value`,
    ]).flat(),
    ...Array.from(
      { length: IMAGE_COLUMN_COUNT },
      (_, i) => `Product Image ${i + 1} Url`
    ),
  ]

  const rows: string[] = [buildCsvRow(headers)]

  for (const product of allProducts) {
    const productOptions = product.options ?? []
    const sortedImages = [...(product.images ?? [])].sort(
      (a, b) => (a.rank ?? 0) - (b.rank ?? 0)
    )

    const variants = product.variants ?? []
    const variantRows = variants.length > 0 ? variants : [null]

    for (const variant of variantRows) {
      const optionMap = new Map<string, string>()
      if (variant?.options) {
        for (const vo of variant.options) {
          const prodOption = productOptions.find(
            (po) => po.id === vo.option_id || po.id === vo.option?.id
          )
          if (prodOption) {
            optionMap.set(prodOption.title, vo.value)
          }
        }
      }

      const priceMap = new Map<string, number>()
      if (variant?.prices) {
        for (const price of variant.prices) {
          if (!price.price_rules?.length) {
            priceMap.set(price.currency_code.toUpperCase(), price.amount)
          }
        }
      }

      const fields: (string | number | boolean | null | undefined)[] = [
        product.id,
        product.handle,
        product.title,
        product.subtitle,
        product.description,
        product.status,
        product.thumbnail,
        product.weight,
        product.length,
        product.width,
        product.height,
        product.hs_code,
        product.origin_country,
        product.mid_code,
        product.material,
        product.shipping_profile?.id,
        ...Array.from({ length: maxSalesChannels }, (_, i) =>
          product.sales_channels?.[i]?.id ?? ""
        ),
        product.collection_id,
        ...Array.from({ length: maxCategories }, (_, i) =>
          product.categories?.[i]?.id ?? ""
        ),
        product.type_id,
        ...Array.from({ length: maxTags }, (_, i) =>
          product.tags?.[i]?.value ?? ""
        ),
        product.discountable,
        product.external_id,
        variant?.id ?? "",
        variant?.title ?? "",
        variant?.sku ?? "",
        variant?.barcode ?? "",
        variant?.allow_backorder ?? "",
        variant?.manage_inventory ?? "",
        variant?.weight ?? "",
        variant?.length ?? "",
        variant?.width ?? "",
        variant?.height ?? "",
        variant?.hs_code ?? "",
        variant?.origin_country ?? "",
        variant?.mid_code ?? "",
        variant?.material ?? "",
        ...sortedCurrencies.map((c) => priceMap.get(c) ?? ""),
        ...Array.from({ length: maxOptions }, (_, i) => {
          const optTitle = productOptions[i]?.title ?? ""
          const optValue = optTitle ? (optionMap.get(optTitle) ?? "") : ""
          return [optTitle, optValue]
        }).flat(),
        ...Array.from({ length: IMAGE_COLUMN_COUNT }, (_, i) =>
          sortedImages[i]?.url ?? ""
        ),
      ]

      rows.push(buildCsvRow(fields))
    }
  }

  const csvContent = "\uFEFF" + rows.join("\r\n")

  res.json({
    csv: csvContent,
    summary: {
      totalProducts: allProducts.length,
      totalRows: rows.length - 1,
      imageColumnsIncluded: IMAGE_COLUMN_COUNT,
    },
  })
}
