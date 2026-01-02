import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MobileFilterDrawer from "@modules/store/components/mobile-filter-drawer"
import MobileSortSelect from "@modules/store/components/mobile-sort-select"
import { ProductFilters } from "@modules/store/templates"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  filters,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  filters?: ProductFilters
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="content-container py-3 small:py-4">
          <nav className="flex items-center gap-2 text-xs small:text-sm text-stone-500">
            <LocalizedClientLink href="/" className="hover:text-stone-800 transition-colors">
              Home
            </LocalizedClientLink>
            <span>/</span>
            <LocalizedClientLink href="/store" className="hover:text-stone-800 transition-colors">
              Kollektionen
            </LocalizedClientLink>
            <span>/</span>
            <span className="text-stone-800">{collection.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-container pt-6 small:pt-8 pb-12 small:pb-16">
        <div className="flex flex-col small:flex-row gap-6 small:gap-8">
          {/* Filters Sidebar - Desktop/Tablet */}
          <aside className="hidden small:block w-56 medium:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6 bg-white rounded-xl border border-stone-200 p-4 medium:p-5">
              <RefinementList sortBy={sort} filters={filters} />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Page Header */}
            <div className="mb-6 small:mb-8">
              <h1 className="font-serif text-2xl small:text-3xl medium:text-4xl font-medium text-stone-800">
                {collection.title}
              </h1>
              {collection.description && (
                <p className="mt-2 text-sm small:text-base text-stone-600">
                  {collection.description}
                </p>
              )}
            </div>

            {/* Mobile/Tablet Filter & Sort Bar */}
            <div className="small:hidden mb-4">
              <div className="flex items-center gap-3">
                <MobileFilterDrawer sortBy={sort} filters={filters} />
                <div className="flex-1">
                  <MobileSortSelect sortBy={sort} />
                </div>
              </div>
            </div>

            {/* Products */}
            <Suspense
              fallback={
                <SkeletonProductGrid
                  numberOfProducts={collection.products?.length}
                />
              }
            >
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                collectionId={collection.id}
                countryCode={countryCode}
                filters={filters}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
