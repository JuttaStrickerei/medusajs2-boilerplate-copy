import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import ProductFilters from "@modules/products/components/product-filters"
import type { FilterGroup } from "@modules/products/components/product-filters"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
  filters,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  filters?: { [key: string]: string }
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  // Define filter groups for store page
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
          <div className="mb-8 text-2xl-semi">
            <h1 data-testid="store-page-title"></h1>
          </div>
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              countryCode={countryCode}
              filters={filters}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
