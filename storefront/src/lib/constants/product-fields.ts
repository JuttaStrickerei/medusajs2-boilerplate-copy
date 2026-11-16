// Eigene Datei, weil lib/data/products.ts „use server“ ist und dort nur
// async-Funktionen exportiert werden dürfen

/**
 * Standardfelder der Produktlisten; Seiten hängen bei Bedarf weitere an.
 * variants.images.id: welches Foto zu welcher Farbe gehört (Karten zum Wischen,
 * lib/util/product-colors). Nur die IDs: "*variants.images" macht die Liste
 * mit 100 Produkten um die Hälfte größer und hebt sie über das 2-MB-Limit
 * des Next-Caches.
 */
export const PRODUCT_LIST_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags,+images,+variants.images.id"
