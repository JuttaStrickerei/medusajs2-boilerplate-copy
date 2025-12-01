import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getRegion } from "./regions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { sortProducts } from "@lib/util/sort-products"

export const getProductsById = cache(async function ({
  ids,
  regionId,
}: {
  ids: string[]
  regionId: string
}) {
  return sdk.store.product
    .list(
      {
        id: ids,
        region_id: regionId,
        fields: "*variants.calculated_price,+variants.inventory_quantity",
      },
      { next: { tags: ["products"] } }
    )
    .then(({ products }) => products)
})

export const getProductByHandle = cache(async function (
  handle: string,
  regionId: string
) {
  return sdk.store.product
    .list(
      {
        handle,
        region_id: regionId,
        fields: "*variants.calculated_price,+variants.inventory_quantity",
      },
      { next: { tags: ["products"] } }
    )
    .then(({ products }) => products[0])
})

export const getProductsList = cache(async function ({
  pageParam = 1,
  queryParams,
  countryCode,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> {
  const limit = queryParams?.limit || 12
  const validPageParam = Math.max(pageParam, 1);
  const offset = (validPageParam - 1) * limit
  const region = await getRegion(countryCode)

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }
  return sdk.store.product
    .list(
      {
        limit,
        offset,
        region_id: region.id,
        fields: "*variants.calculated_price",
        ...queryParams,
      },
      { next: { tags: ["products"] } }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
})

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const getProductsListWithSort = cache(async function ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
  filters,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
  filters?: { [key: string]: string | undefined }
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await getProductsList({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  // Apply filters if provided
  let filteredProducts = sortedProducts
  if (filters) {
    filteredProducts = sortedProducts.filter((product) => {
      // Check each filter
      for (const [filterKey, filterValue] of Object.entries(filters)) {
        if (!filterValue) continue

        const filterValues = filterValue.split(",")

        // Handle different filter types
        switch (filterKey) {
          case "color":
          case "size":
            // Check if any variant has the matching option value
            const hasMatchingVariant = product.variants?.some((variant) =>
              variant.options?.some((option) =>
                filterValues.some((val) =>
                  option.value?.toLowerCase() === val.toLowerCase()
                )
              )
            )
            if (!hasMatchingVariant) return false
            break

          case "material":
            // Check product metadata
            const productMaterial = product.metadata?.material as string
            if (!productMaterial || !filterValues.includes(productMaterial.toLowerCase())) {
              return false
            }
            break

          case "price":
            // Handle price range filter (format: "min-max")
            const [minStr, maxStr] = filterValue.split("-")
            const min = parseInt(minStr) * 100 // Convert to cents
            const max = parseInt(maxStr) * 100

            // Check if any variant price falls within range
            const hasPriceInRange = product.variants?.some((variant) => {
              const price = variant.calculated_price?.calculated_amount
              return price && price >= min && price <= max
            })
            if (!hasPriceInRange) return false
            break

          default:
            // Generic metadata filter
            const metadataValue = product.metadata?.[filterKey] as string
            if (!metadataValue || !filterValues.includes(metadataValue.toLowerCase())) {
              return false
            }
        }
      }
      return true
    })
  }

  const filteredCount = filteredProducts.length
  const pageParam = (page - 1) * limit
  const nextPage = filteredCount > pageParam + limit ? pageParam + limit : null
  const paginatedProducts = filteredProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count: filteredCount,
    },
    nextPage,
    queryParams,
  }
})
