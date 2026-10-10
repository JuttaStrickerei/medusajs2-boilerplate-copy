import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listCategories = async (query?: Record<string, any>) => {
  const next = {
    ...(await getCacheOptions("categories")),
    revalidate: 60,
  }

  const limit = query?.limit || 100

  return sdk.client
    .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
      "/store/product-categories",
      {
        query: {
          fields:
            "+metadata, *category_children, *products, *parent_category, *parent_category.parent_category",
          limit,
          ...query,
        },
        next,
      }
    )
    .then(({ product_categories }) => product_categories)
}

export type NavCategory = Pick<
  HttpTypes.StoreProductCategory,
  "id" | "name" | "handle" | "rank" | "parent_category_id"
>

const NAV_CATEGORY_FIELDS = "id,name,handle,rank,parent_category_id"

/**
 * Oberste Kategorien nach Rang für Navigation, Menü und Footer. Gleiche
 * Abfrage überall, Next fasst sie pro Seitenaufruf zusammen; nur Namen und
 * Handles, denn die Standardfelder laden jedes Produkt jeder Kategorie.
 */
export const listNavCategories = async (): Promise<NavCategory[]> => {
  const categories: NavCategory[] = await listCategories({
    fields: NAV_CATEGORY_FIELDS,
  })

  return categories
    .filter((c) => !c.parent_category_id && c.handle)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = `${categoryHandle.join("/")}`

  const next = {
    ...(await getCacheOptions("categories")),
    revalidate: 60,
  }

  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          fields: "+metadata, *category_children, *products, *parent_category, *parent_category.parent_category",
          handle,
        },
        next,
      }
    )
    .then(({ product_categories }) => product_categories[0])
}
