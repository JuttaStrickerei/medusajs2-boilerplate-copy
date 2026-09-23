import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionByHandle, listCollections } from "@lib/data/collections"
import { listRegions } from "@lib/data/regions"
import { getProductFilterOptions } from "@lib/data/filter-options"
import { StoreCollection, StoreRegion } from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { seoOverride } from "@lib/util/seo"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
    colors?: string
    sizes?: string
    materials?: string
    priceRange?: string
    category?: string
  }>
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  try {
    const { collections } = await listCollections({
      fields: "*products",
    })

    if (!collections) {
      return []
    }

    const countryCodes = await listRegions().then(
      (regions: StoreRegion[]) =>
        regions
          ?.map((r) => r.countries?.map((c) => c.iso_2))
          .flat()
          .filter(Boolean) as string[]
    )

    const collectionHandles = collections.map(
      (collection: StoreCollection) => collection.handle
    )

    const staticParams = countryCodes
      ?.map((countryCode: string) =>
        collectionHandles.map((handle: string | undefined) => ({
          countryCode,
          handle,
        }))
      )
      .flat()

    return staticParams
  } catch (error) {
    console.error(
      `Failed to generate static paths for collection pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  const override = seoOverride(collection.metadata)
  const metadata = {
    title: override.title ?? collection.title,
    description:
      override.description ??
      `Kollektion ${collection.title} – handgefertigte Strickwaren aus feinsten Naturfasern von der Strickerei Jutta.`,
    alternates: {
      canonical: `/${params.countryCode}/collections/${collection.handle}`,
    },
  } as Metadata

  return metadata
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page, colors, sizes, materials, priceRange, category } =
    searchParams

  const collection = await getCollectionByHandle(params.handle).then(
    (collection: StoreCollection) => collection
  )

  if (!collection) {
    notFound()
  }

  const filters = {
    colors: colors ? colors.split(",") : undefined,
    sizes: sizes ? sizes.split(",") : undefined,
    materials: materials ? materials.split(",") : undefined,
    priceRange: priceRange || undefined,
    category: category || undefined,
  }

  const filterOptions = await getProductFilterOptions(params.countryCode, {
    collectionId: collection.id,
  })

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
      filters={filters}
      filterOptions={filterOptions}
    />
  )
}
