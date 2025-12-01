import { notFound } from "next/navigation"
import { Suspense } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductFilters from "@modules/products/components/product-filters"
import type { FilterGroup } from "@modules/products/components/product-filters"
import { HttpTypes } from "@medusajs/types"

export default function CategoryTemplate({
  categories,
  sortBy,
  page,
  countryCode,
  filters,
}: {
  categories: HttpTypes.StoreProductCategory[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
  filters?: { [key: string]: string }
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  const category = categories[categories.length - 1]
  const parents = categories.slice(0, categories.length - 1)

  if (!category || !countryCode) notFound()

  // Define filter groups for this category
  const filterGroups: FilterGroup[] = [
    {
      id: "color",
      label: "Farbe",
      options: [
        { id: "col-1", label: "Natur", value: "natural" },
        { id: "col-2", label: "Navy", value: "navy" },
        { id: "col-3", label: "Grau", value: "gray" },
        { id: "col-4", label: "Schwarz", value: "black" },
        { id: "col-5", label: "Weiß", value: "white" },
      ],
    },
    {
      id: "size",
      label: "Größe",
      options: [
        { id: "size-1", label: "XS", value: "xs" },
        { id: "size-2", label: "S", value: "s" },
        { id: "size-3", label: "M", value: "m" },
        { id: "size-4", label: "L", value: "l" },
        { id: "size-5", label: "XL", value: "xl" },
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
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <div className="flex flex-col lg:flex-row gap-8 w-full">
        <ProductFilters filterGroups={filterGroups} />
        <div className="flex-1 min-w-0">
        <div className="flex flex-row mb-8 text-2xl-semi gap-4">
          {parents &&
            parents.map((parent) => (
              <span key={parent.id} className="text-ui-fg-subtle">
                <LocalizedClientLink
                  className="mr-4 hover:text-black"
                  href={`/categories/${parent.handle}`}
                  data-testid="sort-by-link"
                >
                  {parent.name}
                </LocalizedClientLink>
                /
              </span>
            ))}
          <h1 data-testid="category-page-title">{category.name}</h1>
        </div>
        {category.description && (
          <div className="mb-8 text-base-regular">
            <p>{category.description}</p>
          </div>
        )}
        {category.category_children && (
          <div className="mb-8 text-base-large">
            <ul className="grid grid-cols-1 gap-2">
              {category.category_children?.map((c) => (
                <li key={c.id}>
                  <InteractiveLink href={`/categories/${c.handle}`}>
                    {c.name}
                  </InteractiveLink>
                </li>
              ))}
            </ul>
          </div>
        )}
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              categoryId={category.id}
              countryCode={countryCode}
              filters={filters}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
