/**
 * EXAMPLE: How to integrate ProductFilters component
 *
 * This file demonstrates the complete integration pattern for the ProductFilters
 * component following MedusaJS architecture best practices.
 */

// ============================================================================
// EXAMPLE 1: Category Page with Filters
// ============================================================================

// File: app/[countryCode]/(main)/categories/[...category]/page.tsx
import { Suspense } from "react"
import { getCategoryByHandle } from "@lib/data/categories"
import ProductFilters, { FilterGroup } from "@modules/products/components/product-filters"
import PaginatedProducts from "@modules/store/templates/paginated-products"

type CategoryPageProps = {
  params: { category: string[]; countryCode: string }
  searchParams: {
    sortBy?: string
    page?: string
    // Filter params
    color?: string
    size?: string
    material?: string
    price?: string
  }
}

export default async function CategoryPageExample({ params, searchParams }: CategoryPageProps) {
  const { product_categories } = await getCategoryByHandle(params.category)
  const category = product_categories[product_categories.length - 1]

  // Build filter groups from category metadata or static config
  const filterGroups: FilterGroup[] = [
    {
      id: "color",
      label: "Farbe",
      options: [
        { id: "col-1", label: "Natur", value: "natural", count: 24 },
        { id: "col-2", label: "Navy", value: "navy", count: 18 },
        { id: "col-3", label: "Grau", value: "gray", count: 15 },
        { id: "col-4", label: "Schwarz", value: "black", count: 12 },
      ],
    },
    {
      id: "size",
      label: "Größe",
      options: [
        { id: "size-1", label: "XS", value: "xs", count: 10 },
        { id: "size-2", label: "S", value: "s", count: 22 },
        { id: "size-3", label: "M", value: "m", count: 28 },
        { id: "size-4", label: "L", value: "l", count: 25 },
        { id: "size-5", label: "XL", value: "xl", count: 15 },
      ],
    },
    {
      id: "material",
      label: "Material",
      options: [
        { id: "mat-1", label: "Wolle", value: "wool", count: 30 },
        { id: "mat-2", label: "Baumwolle", value: "cotton", count: 20 },
        { id: "mat-3", label: "Kaschmir", value: "cashmere", count: 8 },
        { id: "mat-4", label: "Seide", value: "silk", count: 5 },
      ],
    },
    {
      id: "price",
      label: "Preis",
      options: [
        { id: "price-1", label: "Unter 50€", value: "0-50" },
        { id: "price-2", label: "50€ - 100€", value: "50-100" },
        { id: "price-3", label: "100€ - 200€", value: "100-200" },
        { id: "price-4", label: "Über 200€", value: "200-999999" },
      ],
    },
  ]

  return (
    <div className="content-container py-6">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-stone-500">
        <span>Home</span> / <span>{category.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar - Desktop visible, Mobile shows button */}
        <ProductFilters filterGroups={filterGroups} />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Category Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-serif font-medium text-stone-800 mb-3">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-stone-600 max-w-3xl">{category.description}</p>
            )}
          </div>

          {/* Products Grid with Filters Applied */}
          <Suspense fallback={<div>Loading products...</div>}>
            <PaginatedProducts
              sortBy={searchParams.sortBy}
              page={searchParams.page ? parseInt(searchParams.page) : 1}
              categoryId={category.id}
              countryCode={params.countryCode}
              // Pass filter params to product fetcher
              filters={{
                color: searchParams.color?.split(","),
                size: searchParams.size?.split(","),
                material: searchParams.material?.split(","),
                price: searchParams.price,
              }}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EXAMPLE 2: Store Page with Dynamic Filters from API
// ============================================================================

// File: app/[countryCode]/(main)/store/page.tsx
import { sdk } from "@lib/config"

type StorePageProps = {
  params: { countryCode: string }
  searchParams: Record<string, string>
}

export default async function StorePageExample({ params, searchParams }: StorePageProps) {
  // Fetch available filter facets from your API
  const facets = await fetchProductFacets(params.countryCode)

  // Transform API response to FilterGroup format
  const filterGroups: FilterGroup[] = facets.map((facet) => ({
    id: facet.attribute_name,
    label: facet.display_name,
    options: facet.values.map((value, idx) => ({
      id: `${facet.attribute_name}-${idx}`,
      label: value.label,
      value: value.value,
      count: value.product_count,
    })),
  }))

  return (
    <div className="content-container py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        <ProductFilters filterGroups={filterGroups} />

        <div className="flex-1">
          <h1 className="text-2xl font-medium text-stone-800 mb-6">
            Alle Produkte
          </h1>
          <PaginatedProducts
            countryCode={params.countryCode}
            filters={searchParams}
          />
        </div>
      </div>
    </div>
  )
}

// Helper function to fetch facets (customize based on your backend)
async function fetchProductFacets(countryCode: string) {
  // Example: Query MeiliSearch or custom API endpoint
  return [
    {
      attribute_name: "category",
      display_name: "Kategorie",
      values: [
        { label: "Strickwaren", value: "knitwear", product_count: 45 },
        { label: "Accessoires", value: "accessories", product_count: 23 },
      ],
    },
  ]
}

// ============================================================================
// EXAMPLE 3: Server Action for Filtered Product Fetching
// ============================================================================

// File: modules/products/actions.ts
"use server"

import { sdk } from "@lib/config"

export async function getFilteredProducts({
  categoryId,
  filters,
  page = 1,
  limit = 12,
}: {
  categoryId?: string
  filters?: Record<string, string | string[]>
  page?: number
  limit?: number
}) {
  const queryFilters: any = {}

  // Build MedusaJS query filters
  if (categoryId) {
    queryFilters.category_id = [categoryId]
  }

  // Handle color filter
  if (filters?.color) {
    const colors = Array.isArray(filters.color)
      ? filters.color
      : filters.color.split(",")
    queryFilters["variants.options.value"] = colors
  }

  // Handle size filter
  if (filters?.size) {
    const sizes = Array.isArray(filters.size)
      ? filters.size
      : filters.size.split(",")
    queryFilters["variants.options.value"] = [
      ...(queryFilters["variants.options.value"] || []),
      ...sizes,
    ]
  }

  // Handle material filter (assuming it's a custom attribute)
  if (filters?.material) {
    const materials = Array.isArray(filters.material)
      ? filters.material
      : filters.material.split(",")
    queryFilters["metadata.material"] = materials
  }

  // Handle price range filter
  if (filters?.price) {
    const [min, max] = filters.price.split("-").map(Number)
    queryFilters.variants = {
      calculated_price: {
        gte: min * 100, // Convert to cents
        lte: max * 100,
      },
    }
  }

  const { products, count } = await sdk.store.product.list({
    fields: "+variants.calculated_price",
    limit,
    offset: (page - 1) * limit,
    ...queryFilters,
  })

  return {
    products,
    count,
    pageCount: Math.ceil(count / limit),
  }
}

// ============================================================================
// EXAMPLE 4: Usage with Search/MeiliSearch
// ============================================================================

// File: app/[countryCode]/(main)/search/page.tsx
import { InstantSearch } from "react-instantsearch-hooks-web"
import ProductFilters from "@modules/products/components/product-filters"

export default function SearchPageExample({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const filterGroups: FilterGroup[] = [
    // ... your filter configuration
  ]

  return (
    <div className="content-container py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters work the same way with search */}
        <ProductFilters filterGroups={filterGroups} />

        <div className="flex-1">
          <h1 className="text-xl text-stone-600 mb-6">
            Suchergebnisse für: <strong>{searchParams.q}</strong>
          </h1>
          {/* Your search results component */}
        </div>
      </div>
    </div>
  )
}
