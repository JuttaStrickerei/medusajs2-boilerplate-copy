import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { ViewItemList } from "@modules/common/components/analytics"
import { productToItem } from "@lib/util/analytics"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"
import { ProductFilters } from "./index"
import { DynamicFilterOptions } from "@lib/data/filter-options"
import { getProductMinVariantPriceForFilter } from "@lib/util/variant-price-for-filter"
import {
  COLOR_OPTION_TITLES,
  SIZE_OPTION_TITLES,
  getColorGroupKeys,
  getSizeGroupKey,
} from "@lib/util/filter-groups"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

function matchesColorFilter(product: HttpTypes.StoreProduct, colors: string[]): boolean {
  if (!colors || colors.length === 0) return true

  // Selected values are colour groups ("blau"); older links may still carry a
  // shade ("königsblau"), which resolves to its group the same way.
  const selectedGroups = new Set(colors.flatMap((c) => getColorGroupKeys(c)))

  const colorValues =
    product.variants?.flatMap((variant) =>
      (variant.options || [])
        .filter((option) =>
          COLOR_OPTION_TITLES.includes(option.option?.title?.toLowerCase() || "")
        )
        .map((option) => option.value || "")
    ) ?? []

  if (colorValues.length > 0) {
    return colorValues.some((value) =>
      getColorGroupKeys(value).some((key) => selectedGroups.has(key))
    )
  }

  // Title fallback only for products without a colour option, otherwise
  // "rosa" would match "Jacke ROSANA" in magenta.
  const productTitle = product.title?.toLowerCase() || ""
  return colors.some((color) => productTitle.includes(color.toLowerCase()))
}

function matchesSizeFilter(product: HttpTypes.StoreProduct, sizes: string[]): boolean {
  if (!sizes || sizes.length === 0) return true

  // Numeric sizes match their letter size (42 → M), see filter-groups.ts
  const selectedSizes = new Set(sizes.map(getSizeGroupKey))

  const hasMatchingSize = product.variants?.some((variant) => {
    return variant.options?.some((option) => {
      const optionTitle = option.option?.title?.toLowerCase() || ""

      if (SIZE_OPTION_TITLES.includes(optionTitle)) {
        return selectedSizes.has(getSizeGroupKey(option.value || ""))
      }
      return false
    })
  })

  const hasSizeInVariant = product.variants?.some((variant) => {
    return selectedSizes.has(getSizeGroupKey(variant.title || ""))
  })

  return !!(hasMatchingSize || hasSizeInVariant)
}

function stripMaterialPercentage(raw: string): string {
  return raw.trim().replace(/^\d+\s*%\s*/, "").trim()
}

function matchesMaterialFilter(product: HttpTypes.StoreProduct, materials: string[]): boolean {
  if (!materials || materials.length === 0) return true

  const selectedMaterials = materials.map((m) => m.toLowerCase())

  // Split product.material on comma, strip leading percentages, normalise to lowercase
  const rawMaterial = (product.material as string) || ""
  const productMaterials = rawMaterial
    .split(",")
    .map((p) => stripMaterialPercentage(p).toLowerCase())
    .filter(Boolean)

  // Check if any selected material matches any of the product's individual materials
  const hasMaterialMatch = selectedMaterials.some((selected) =>
    productMaterials.some((pm) => pm === selected || pm.includes(selected))
  )

  if (hasMaterialMatch) return true

  // Fallback: check title and description
  const productTitle = product.title?.toLowerCase() || ""
  const productDescription = product.description?.toLowerCase() || ""

  return selectedMaterials.some((mat) =>
    productTitle.includes(mat) || productDescription.includes(mat)
  )
}

function matchesPriceFilter(
  product: HttpTypes.StoreProduct,
  priceRange: string | undefined,
  priceRanges: DynamicFilterOptions["priceRanges"]
): boolean {
  if (!priceRange) return true

  const range = priceRanges.find((r) => r.value === priceRange)
  if (!range) return true

  const minPrice = getProductMinVariantPriceForFilter(product)
  if (minPrice === null) return true

  if (range.max === Infinity) {
    return minPrice >= range.min
  }
  // Inclusive upper bound so products at exactly the boundary are included
  return minPrice >= range.min && minPrice <= range.max
}

function filterProducts(
  products: HttpTypes.StoreProduct[],
  filters: ProductFilters | undefined,
  priceRanges: DynamicFilterOptions["priceRanges"]
): HttpTypes.StoreProduct[] {
  if (!filters) return products
  
  return products.filter((product) => {
    const matchesColor = matchesColorFilter(product, filters.colors || [])
    const matchesSize = matchesSizeFilter(product, filters.sizes || [])
    const matchesMaterial = matchesMaterialFilter(product, filters.materials || [])
    const matchesPrice = matchesPriceFilter(product, filters.priceRange, priceRanges)
    
    return matchesColor && matchesSize && matchesMaterial && matchesPrice
  })
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  filters,
  filterOptions,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  filters?: ProductFilters
  filterOptions?: DynamicFilterOptions
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 100,
  }

  // Category/collection from URL filter params take precedence over direct props
  const effectiveCategoryId = filters?.category || categoryId
  const effectiveCollectionId = filters?.collection || collectionId

  if (effectiveCollectionId) {
    queryParams["collection_id"] = [effectiveCollectionId]
  }

  if (effectiveCategoryId) {
    queryParams["category_id"] = [effectiveCategoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  let {
    response: { products, count },
  } = await listProductsWithSort({
    page: 1,
    queryParams,
    sortBy,
    countryCode,
  })

  const hasClientFilters = filters && (
    (filters.colors && filters.colors.length > 0) ||
    (filters.sizes && filters.sizes.length > 0) ||
    (filters.materials && filters.materials.length > 0) ||
    filters.priceRange
  )

  let filteredProducts = products
  let filteredCount = count

  if (hasClientFilters) {
    filteredProducts = filterProducts(products, filters, filterOptions?.priceRanges || [])
    filteredCount = filteredProducts.length
  }

  const startIndex = (page - 1) * PRODUCT_LIMIT
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PRODUCT_LIMIT)
  
  const totalPages = Math.ceil(filteredCount / PRODUCT_LIMIT)

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-stone-800 mb-2">
          Keine Produkte gefunden
        </h3>
        <p className="text-stone-600 max-w-md mx-auto">
          Mit den aktuellen Filtereinstellungen konnten keine passenden Produkte gefunden werden. 
          Bitte passen Sie Ihre Filter an.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Results count */}
      <div className="mb-6 text-sm text-stone-600">
        {filteredCount} {filteredCount === 1 ? "Produkt" : "Produkte"} gefunden
        {hasClientFilters && " (gefiltert)"}
      </div>
      
      <ViewItemList
        listId={categoryId ?? collectionId ?? "store"}
        listName={categoryId ? "Kategorie" : collectionId ? "Kollektion" : "Alle Produkte"}
        items={paginatedProducts.map((p) => productToItem(p))}
      />
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {paginatedProducts.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
