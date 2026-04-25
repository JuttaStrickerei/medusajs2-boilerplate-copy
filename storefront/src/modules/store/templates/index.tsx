import { Suspense } from "react"
import RefinementList from "@modules/store/components/refinement-list"
import MobileFilterDrawer from "@modules/store/components/mobile-filter-drawer"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "./paginated-products"
import { SkeletonProductGrid } from "@components/ui"
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
      {/* Page Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="content-container py-8 small:py-12 medium:py-16">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs small:text-sm text-stone-500 tracking-[0.15em] uppercase mb-2 small:mb-3">
              Entdecken Sie
            </p>
            <h1 className="font-serif text-2xl small:text-3xl medium:text-4xl large:text-5xl font-medium text-stone-800 mb-3 small:mb-4">
              Unsere Kollektionen
            </h1>
            <p className="text-sm small:text-base text-stone-600 leading-relaxed hidden small:block">
              Handgefertigte Strickwaren aus feinsten Naturfasern. Jedes Stück
              ein Unikat, gefertigt mit 60 Jahren Erfahrung.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="content-container py-3 small:py-4">
        <nav className="flex items-center gap-2 text-xs small:text-sm text-stone-500">
          <a href="/" className="hover:text-stone-800 transition-colors">
            Home
          </a>
          <span>/</span>
          <span className="text-stone-800">Alle Produkte</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="content-container pb-12 small:pb-16">
        <div className="flex flex-col tablet:flex-row gap-6 tablet:gap-8">
          {/* Filters Sidebar - Desktop/Tablet */}
          <aside className="hidden tablet:block w-56 medium:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6 bg-white rounded-xl border border-stone-200 p-4 medium:p-5 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <RefinementList
                sortBy={sort}
                filters={filters}
                filterOptions={filterOptions}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Mobile Filter Bar */}
            <div className="tablet:hidden mb-4">
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
            <Suspense fallback={<SkeletonProductGrid count={12} />}>
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
