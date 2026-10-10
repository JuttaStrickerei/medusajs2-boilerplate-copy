import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import PageBreadcrumb from "@modules/common/components/page-breadcrumb"
import PageHeader from "@modules/common/components/page-header"
import MobileFilterDrawer from "@modules/store/components/mobile-filter-drawer"
import { ProductFilters } from "@modules/store/templates"
import { DynamicFilterOptions } from "@lib/data/filter-options"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  filters,
  filterOptions,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  filters?: ProductFilters
  filterOptions: DynamicFilterOptions
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "color_spectrum"

  return (
    <div className="bg-stone-50 min-h-screen">
      <PageBreadcrumb
        items={[
          { label: "Alle Produkte", href: "/store" },
          { label: collection.title },
        ]}
      />
      <PageHeader title={collection.title} />

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
                hideCollections
              />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="min-w-0 flex-1">
            {/* Mobile/Tablet Filter Bar */}
            <div className="mb-4 small:hidden">
              <div className="flex items-center gap-3">
                <MobileFilterDrawer
                  sortBy={sort}
                  filters={filters}
                  filterOptions={filterOptions}
                  hideCollections
                />
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
                filterOptions={filterOptions}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
