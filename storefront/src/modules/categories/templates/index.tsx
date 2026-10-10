import { notFound } from "next/navigation"
import { Suspense } from "react"

import { cn } from "@lib/utils"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PageBreadcrumb from "@modules/common/components/page-breadcrumb"
import PageHeader from "@modules/common/components/page-header"
import { HttpTypes } from "@medusajs/types"
import MobileFilterDrawer from "@modules/store/components/mobile-filter-drawer"
import {
  PILL,
  PILL_IDLE,
} from "@modules/store/components/refinement-list/pill-styles"
import { ProductFilters } from "@modules/store/templates"
import { DynamicFilterOptions } from "@lib/data/filter-options"

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  filters,
  filterOptions,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  filters?: ProductFilters
  filterOptions: DynamicFilterOptions
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "color_spectrum"

  if (!category || !countryCode) notFound()

  // Build parent categories array (from root to direct parent)
  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (cat: HttpTypes.StoreProductCategory) => {
    if (cat.parent_category) {
      getParents(cat.parent_category)
      parents.push(cat.parent_category)
    }
  }

  getParents(category)

  // Build breadcrumb path
  const buildCategoryPath = (cat: HttpTypes.StoreProductCategory): string => {
    const path = [cat.handle]
    let current = cat.parent_category
    while (current) {
      path.unshift(current.handle)
      current = current.parent_category
    }
    return path.join("/")
  }

  return (
    <div className="bg-stone-50 min-h-screen" data-testid="category-container">
      <PageBreadcrumb
        items={[
          { label: "Alle Produkte", href: "/store" },
          ...parents.map((parent) => ({
            label: parent.name,
            href: `/categories/${buildCategoryPath(parent)}`,
          })),
          { label: category.name },
        ]}
      />
      <PageHeader
        title={category.name}
        meta={category.description || undefined}
        titleTestId="category-page-title"
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
                hideCategories
                data-testid="sort-by-container"
              />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="min-w-0 flex-1">
            {/* Subcategories */}
            {category.category_children &&
              category.category_children.length > 0 && (
                <div className="mb-5">
                  <h2 className="mb-3 font-sans text-sm font-medium text-stone-800">
                    Unterkategorien
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {category.category_children.map((c) => (
                      <li key={c.id}>
                        <LocalizedClientLink
                          href={`/categories/${buildCategoryPath(c)}`}
                          className={cn(
                            PILL,
                            PILL_IDLE,
                            "h-11 px-4 text-sm small:h-9"
                          )}
                        >
                          {c.name}
                        </LocalizedClientLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Mobile/Tablet Filter Bar */}
            <div className="mb-4 small:hidden">
              <div className="flex items-center gap-3">
                <MobileFilterDrawer
                  sortBy={sort}
                  filters={filters}
                  filterOptions={filterOptions}
                  hideCategories
                />
              </div>
            </div>

            {/* Products */}
            <Suspense
              fallback={
                <SkeletonProductGrid
                  numberOfProducts={category.products?.length ?? 8}
                />
              }
            >
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                categoryId={category.id}
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
