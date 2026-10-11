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

// Nur diese metadata-Schlüssel liest der Storefront: SEO-Overrides,
// Foto-Hinweise, Farbe je Teil, Teile nur im Geschäft und die optionalen
// Angaben der Looks-Übersicht (Farbwelt, Titelbild samt Ausschnitt,
// Stimmungszeile; der Storefront prüft sie). Alles andere, z. B. die
// Quell-Buchhaltung der Look-Importskripte, bleibt aus der öffentlichen API
// draußen.
const PUBLIC_METADATA_KEYS = [
  "seo_title",
  "seo_description",
  "photo_notes",
  "item_colors",
  "store_only_pieces",
  "color_world",
  "cover_index",
  "cover_image",
  "cover_position",
  "cover_zoom",
  "tagline",
]

const toPublicMetadata = (metadata: unknown): Record<string, unknown> | null => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null
  }
  const picked: Record<string, unknown> = {}
  for (const key of PUBLIC_METADATA_KEYS) {
    if (key in metadata) {
      picked[key] = (metadata as Record<string, unknown>)[key]
    }
  }
  return Object.keys(picked).length > 0 ? picked : null
}

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
    metadata: toPublicMetadata(look.metadata),
    product_ids: products.map((p) => p.id),
    product_thumbnails: products.map((p) => p.thumbnail).filter(Boolean),
  }
}
