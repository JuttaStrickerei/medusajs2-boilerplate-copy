import { Suspense } from "react"
import { HttpTypes } from "@medusajs/types"
import RefinementList from "@modules/store/components/refinement-list"
import MobileFilterDrawer from "@modules/store/components/mobile-filter-drawer"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "./paginated-products"
import { SkeletonProductGrid } from "@components/ui"

export interface ProductFilters {
  colors?: string[]
  sizes?: string[]
  materials?: string[]
  priceRange?: string
}

interface StoreTemplateProps {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  categories?: HttpTypes.StoreProductCategory[]
  collections?: HttpTypes.StoreCollection[]
  colors?: string
  sizes?: string
  materials?: string
  priceRange?: string
}

export default function StoreTemplate({
  sortBy,
  page,
  countryCode,
  categories,
  collections,
  colors,
  sizes,
  materials,
  priceRange,
}: StoreTemplateProps) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  
  // Parse filter strings into arrays
  const filters: ProductFilters = {
    colors: colors ? colors.split(",") : undefined,
    sizes: sizes ? sizes.split(",") : undefined,
    materials: materials ? materials.split(",") : undefined,
    priceRange: priceRange || undefined,
  }

  // Count active filters
  const activeFilterCount = 
    (filters.colors?.length || 0) + 
    (filters.sizes?.length || 0) + 
    (filters.materials?.length || 0) + 
    (filters.priceRange ? 1 : 0)

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
              Handgefertigte Strickwaren aus feinsten Naturfasern. 
              Jedes Stück ein Unikat, gefertigt mit 60 Jahren Erfahrung.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="content-container py-3 small:py-4">
        <nav className="flex items-center gap-2 text-xs small:text-sm text-stone-500">
          <a href="/" className="hover:text-stone-800 transition-colors">Home</a>
          <span>/</span>
          <span className="text-stone-800">Alle Produkte</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="content-container pb-12 small:pb-16">
        <div className="flex flex-col small:flex-row gap-6 small:gap-8">
          {/* Filters Sidebar - Desktop/Tablet */}
          <aside className="hidden small:block w-56 medium:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6 bg-white rounded-xl border border-stone-200 p-4 medium:p-5">
              {/* Refinement List (includes Sort + Filters) */}
              <RefinementList sortBy={sort} filters={filters} />

              {/* Categories */}
              {categories && categories.length > 0 && (
                <div className="pt-4 border-t border-stone-200">
                  <h3 className="text-sm font-medium text-stone-800 mb-3">Kategorien</h3>
                  <ul className="space-y-2">
                    {categories
                      .filter((c) => !c.parent_category)
                      .slice(0, 8)
                      .map((category) => (
                        <li key={category.id}>
                          <a
                            href={`/categories/${category.handle}`}
                            className="text-sm text-stone-600 hover:text-stone-800 transition-colors"
                          >
                            {category.name}
                          </a>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Collections */}
              {collections && collections.length > 0 && (
                <div className="pt-4 border-t border-stone-200">
                  <h3 className="text-sm font-medium text-stone-800 mb-3">Kollektionen</h3>
                  <ul className="space-y-2">
                    {collections.slice(0, 8).map((collection) => (
                      <li key={collection.id}>
                        <a
                          href={`/collections/${collection.handle}`}
                          className="text-sm text-stone-600 hover:text-stone-800 transition-colors"
                        >
                          {collection.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Mobile/Tablet Filter Bar */}
            <div className="small:hidden mb-4">
              <div className="flex items-center gap-3">
                {/* Filter Button with Drawer */}
                <MobileFilterDrawer sortBy={sort} filters={filters} />
              </div>
              
              {/* Active Filter Count on Mobile */}
              {activeFilterCount > 0 && (
                <p className="mt-3 text-sm text-stone-600">
                  {activeFilterCount} {activeFilterCount === 1 ? "Filter" : "Filter"} aktiv
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
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
