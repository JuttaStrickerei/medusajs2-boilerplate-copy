import { notFound } from "next/navigation"
import { Suspense } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import MobileFilterDrawer from "@modules/store/components/mobile-filter-drawer"
import { ProductFilters } from "@modules/store/templates"

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  filters,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  filters?: ProductFilters
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

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
      {/* Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="content-container py-3 small:py-4">
          <nav className="flex items-center gap-2 text-xs small:text-sm text-stone-500">
            <LocalizedClientLink href="/" className="hover:text-stone-800 transition-colors">
              Home
            </LocalizedClientLink>
            <span>/</span>
            <LocalizedClientLink href="/categories" className="hover:text-stone-800 transition-colors">
              Kategorien
            </LocalizedClientLink>
            {parents.map((parent) => (
              <span key={parent.id}>
                <span>/</span>
                <LocalizedClientLink
                  href={`/categories/${buildCategoryPath(parent)}`}
                  className="hover:text-stone-800 transition-colors"
                >
                  {parent.name}
                </LocalizedClientLink>
              </span>
            ))}
            <span>/</span>
            <span className="text-stone-800">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-container pt-6 small:pt-8 pb-12 small:pb-16">
        <div className="flex flex-col small:flex-row gap-6 small:gap-8">
          {/* Filters Sidebar - Desktop/Tablet */}
          <aside className="hidden small:block w-56 medium:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6 bg-white rounded-xl border border-stone-200 p-4 medium:p-5">
              <RefinementList sortBy={sort} filters={filters} data-testid="sort-by-container" />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Page Header */}
            <div className="mb-6 small:mb-8">
              <h1 className="font-serif text-2xl small:text-3xl medium:text-4xl font-medium text-stone-800" data-testid="category-page-title">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-2 text-sm small:text-base text-stone-600">
                  {category.description}
                </p>
              )}
            </div>

            {/* Subcategories */}
            {category.category_children && category.category_children.length > 0 && (
              <div className="mb-6 small:mb-8">
                <h2 className="text-sm font-medium text-stone-800 mb-3">Unterkategorien</h2>
                <ul className="flex flex-wrap gap-2">
                  {category.category_children.map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        href={`/categories/${buildCategoryPath(c)}`}
                        className="inline-block px-4 py-2 text-sm text-stone-600 bg-stone-100 rounded-full hover:bg-stone-800 hover:text-white transition-colors"
                      >
                        {c.name}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mobile/Tablet Filter Bar */}
            <div className="small:hidden mb-4">
              <div className="flex items-center gap-3">
                <MobileFilterDrawer sortBy={sort} filters={filters} />
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
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
