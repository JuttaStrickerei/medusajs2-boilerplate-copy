import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"
import { getProductFilterOptions } from "@lib/data/filter-options"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    colors?: string
    sizes?: string
    materials?: string
    priceRange?: string
    category?: string
    collection?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page, colors, sizes, materials, priceRange, category, collection } = searchParams

  const filterOptions = await getProductFilterOptions(params.countryCode)

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      colors={colors}
      sizes={sizes}
      materials={materials}
      priceRange={priceRange}
      category={category}
      collection={collection}
      filterOptions={filterOptions}
    />
  )
}
