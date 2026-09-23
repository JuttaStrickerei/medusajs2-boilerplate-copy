// Öffentliche Felder eines Looks. Die Produkte selbst lädt der Storefront
// über /store/products, damit Preise, Steuern, Lagerbestand und
// Verkaufskanal genau wie auf der Produktseite berechnet werden.
export const STORE_LOOK_FIELDS = [
  "id",
  "title",
  "handle",
  "description",
  "images",
  "rank",
  "metadata",
  "created_at",
  "updated_at",
  "items.id",
  "items.rank",
  "items.product.id",
  "items.product.status",
  "items.product.thumbnail",
]

type StoreLookRow = {
  items?: ({
    id: string
    rank?: number | null
    product?: { id: string; status?: string; thumbnail?: string | null } | null
  } | null)[]
} & Record<string, unknown>

// Teile nach rank sortieren und nur veröffentlichte Produkte ausliefern
export const toStoreLook = ({ items, ...look }: StoreLookRow) => {
  const products = (items ?? [])
    .filter(
      (item): item is NonNullable<typeof item> =>
        !!item?.product && item.product.status === "published"
    )
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((item) => ({
      id: item.product!.id,
      thumbnail: item.product!.thumbnail ?? null,
    }))

  return {
    ...look,
    product_ids: products.map((p) => p.id),
    product_thumbnails: products.map((p) => p.thumbnail).filter(Boolean),
  }
}
