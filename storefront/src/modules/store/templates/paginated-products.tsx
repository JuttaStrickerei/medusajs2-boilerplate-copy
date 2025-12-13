import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"
import { ProductFilters } from "./index"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

// Price range boundaries (in cents)
const priceRanges: Record<string, { min: number; max: number }> = {
  "0-100": { min: 0, max: 10000 },
  "100-200": { min: 10000, max: 20000 },
  "200-300": { min: 20000, max: 30000 },
  "300+": { min: 30000, max: Infinity },
}

// Color name mappings (German -> English and vice versa)
const colorMappings: Record<string, string[]> = {
  schwarz: ["schwarz", "black"],
  weiß: ["weiß", "weiss", "white"],
  grau: ["grau", "gray", "grey"],
  beige: ["beige", "cream", "creme"],
  braun: ["braun", "brown"],
  blau: ["blau", "blue"],
  navy: ["navy", "dunkelblau", "dark blue"],
  rot: ["rot", "red"],
  grün: ["grün", "gruen", "green"],
}

// Helper to check if product matches color filter
function matchesColorFilter(product: HttpTypes.StoreProduct, colors: string[]): boolean {
  if (!colors || colors.length === 0) return true
  
  // Expand colors to include all variations
  const expandedColors = colors.flatMap((color) => {
    const mapped = colorMappings[color.toLowerCase()]
    return mapped || [color.toLowerCase()]
  })
  
  // Check variants for color option
  const hasMatchingColor = product.variants?.some((variant) => {
    return variant.options?.some((option) => {
      const optionTitle = option.option?.title?.toLowerCase() || ""
      const optionValue = option.value?.toLowerCase() || ""
      
      // Check if this is a color option
      if (optionTitle === "color" || optionTitle === "farbe" || optionTitle === "colour") {
        return expandedColors.some((color) => 
          optionValue.includes(color) || color.includes(optionValue)
        )
      }
      return false
    })
  })
  
  // Also check product title/metadata for color mentions
  const productTitle = product.title?.toLowerCase() || ""
  const hasColorInTitle = expandedColors.some((color) => productTitle.includes(color))
  
  return hasMatchingColor || hasColorInTitle
}

// Helper to check if product matches size filter
function matchesSizeFilter(product: HttpTypes.StoreProduct, sizes: string[]): boolean {
  if (!sizes || sizes.length === 0) return true
  
  // Normalize sizes
  const normalizedSizes = sizes.map((s) => s.toLowerCase())
  
  // Check variants for size option
  const hasMatchingSize = product.variants?.some((variant) => {
    return variant.options?.some((option) => {
      const optionTitle = option.option?.title?.toLowerCase() || ""
      const optionValue = option.value?.toLowerCase() || ""
      
      // Check if this is a size option
      if (optionTitle === "size" || optionTitle === "größe" || optionTitle === "groesse") {
        return normalizedSizes.some((size) => 
          optionValue === size || 
          optionValue.includes(size) ||
          size.includes(optionValue)
        )
      }
      return false
    })
  })
  
  // Also check variant title for size mentions
  const hasSizeInVariant = product.variants?.some((variant) => {
    const variantTitle = variant.title?.toLowerCase() || ""
    return normalizedSizes.some((size) => variantTitle.includes(size))
  })
  
  return hasMatchingSize || hasSizeInVariant
}

// Helper to check if product matches material filter
function matchesMaterialFilter(product: HttpTypes.StoreProduct, materials: string[]): boolean {
  if (!materials || materials.length === 0) return true
  
  // Check product metadata, tags, or description for materials
  const productDescription = product.description?.toLowerCase() || ""
  const productTitle = product.title?.toLowerCase() || ""
  const productMaterial = (product.material as string)?.toLowerCase() || ""
  
  // Check if material is in product data
  const hasMaterialMatch = materials.some((material) => {
    const materialLower = material.toLowerCase()
    return (
      productDescription.includes(materialLower) ||
      productTitle.includes(materialLower) ||
      productMaterial.includes(materialLower)
    )
  })
  
  // Also check tags if available
  const hasMaterialTag = product.tags?.some((tag) => {
    const tagValue = tag.value?.toLowerCase() || ""
    return materials.some((material) => tagValue.includes(material.toLowerCase()))
  })
  
  return hasMaterialMatch || hasMaterialTag
}

// Helper to check if product matches price filter
function matchesPriceFilter(product: HttpTypes.StoreProduct, priceRange: string | undefined): boolean {
  if (!priceRange) return true
  
  const range = priceRanges[priceRange]
  if (!range) return true
  
  // Get the lowest price from all variants
  const prices = product.variants?.map((variant) => {
    const calculatedPrice = variant.calculated_price
    if (calculatedPrice?.calculated_amount !== undefined) {
      return calculatedPrice.calculated_amount
    }
    return null
  }).filter((p): p is number => p !== null)
  
  if (!prices || prices.length === 0) return true
  
  const minPrice = Math.min(...prices)
  
  return minPrice >= range.min && minPrice < range.max
}

// Apply all filters to products
function filterProducts(
  products: HttpTypes.StoreProduct[],
  filters?: ProductFilters
): HttpTypes.StoreProduct[] {
  if (!filters) return products
  
  return products.filter((product) => {
    const matchesColor = matchesColorFilter(product, filters.colors || [])
    const matchesSize = matchesSizeFilter(product, filters.sizes || [])
    const matchesMaterial = matchesMaterialFilter(product, filters.materials || [])
    const matchesPrice = matchesPriceFilter(product, filters.priceRange)
    
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
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  filters?: ProductFilters
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 100, // Fetch more to allow for client-side filtering
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
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
    page: 1, // Always fetch from start for filtering
    queryParams,
    sortBy,
    countryCode,
  })

  // Apply client-side filters
  const hasFilters = filters && (
    (filters.colors && filters.colors.length > 0) ||
    (filters.sizes && filters.sizes.length > 0) ||
    (filters.materials && filters.materials.length > 0) ||
    filters.priceRange
  )

  let filteredProducts = products
  let filteredCount = count

  if (hasFilters) {
    filteredProducts = filterProducts(products, filters)
    filteredCount = filteredProducts.length
  }

  // Apply pagination to filtered results
  const startIndex = (page - 1) * PRODUCT_LIMIT
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PRODUCT_LIMIT)
  
  const totalPages = Math.ceil(filteredCount / PRODUCT_LIMIT)

  // Show message when no products match filters
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
        {hasFilters && " (gefiltert)"}
      </div>
      
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
