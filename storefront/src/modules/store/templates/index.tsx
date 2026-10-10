import { Suspense } from "react"
import RefinementList from "@modules/store/components/refinement-list"
import MobileFilterDrawer from "@modules/store/components/mobile-filter-drawer"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PageBreadcrumb from "@modules/common/components/page-breadcrumb"
import PageHeader from "@modules/common/components/page-header"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import PaginatedProducts from "./paginated-products"
import { DynamicFilterOptions } from "@lib/data/filter-options"

export interface ProductFilters {
  colors?: string[]
  sizes?: string[]
  materials?: string[]
  priceRange?: string
  category?: string
  collection?: string
}

interface StoreTemplateProps {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  colors?: string
  sizes?: string
  materials?: string
  priceRange?: string
  category?: string
  collection?: string
  filterOptions: DynamicFilterOptions
}

export default function StoreTemplate({
  sortBy,
  page,
  countryCode,
  colors,
  sizes,
  materials,
  priceRange,
  category,
  collection,
  filterOptions,
}: StoreTemplateProps) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "color_spectrum"

  const filters: ProductFilters = {
    colors: colors ? colors.split(",") : undefined,
    sizes: sizes ? sizes.split(",") : undefined,
    materials: materials ? materials.split(",") : undefined,
    priceRange: priceRange || undefined,
    category: category || undefined,
    collection: collection || undefined,
  }

  const activeFilterCount =
    (filters.colors?.length || 0) +
    (filters.sizes?.length || 0) +
    (filters.materials?.length || 0) +
    (filters.priceRange ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.collection ? 1 : 0)

  return (
    <div className="bg-stone-50 min-h-screen">
      <PageBreadcrumb items={[{ label: "Alle Produkte" }]} />
      <PageHeader
        title="Alle Produkte"
        meta="Handgefertigte Strickwaren aus feinsten Naturfasern."
      />

      {/* Main Content */}
      <div className="content-container pb-12 small:pb-16">
        <div className="flex flex-col gap-6 small:flex-row small:gap-8">
          {/* Filter-Spalte ab 1024px */}
          <aside className="hidden w-56 flex-shrink-0 small:block medium:w-64">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-6 overflow-y-auto rounded border border-stone-200 bg-white p-4 medium:p-5">
              <RefinementList
                sortBy={sort}
                filters={filters}
                filterOptions={filterOptions}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="min-w-0 flex-1">
            {/* Mobile Filter Bar */}
            <div className="mb-4 small:hidden">
              <div className="flex items-center gap-3">
                <MobileFilterDrawer
                  sortBy={sort}
                  filters={filters}
                  filterOptions={filterOptions}
                />
              </div>

              {activeFilterCount > 0 && (
                <p className="mt-3 text-sm text-stone-600">
                  {activeFilterCount}{" "}
                  {activeFilterCount === 1 ? "Filter" : "Filter"} aktiv
                </p>
              )}
            </div>

            {/* Products */}
            <Suspense fallback={<SkeletonProductGrid numberOfProducts={12} />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                countryCode={countryCode}
                filters={filters}
                filterOptions={filterOptions}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
