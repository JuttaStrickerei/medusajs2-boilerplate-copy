// Eigene Datei, weil lib/data/products.ts „use server“ ist und dort nur
// async-Funktionen exportiert werden dürfen

/** Standardfelder der Produktlisten; Seiten hängen bei Bedarf weitere an */
export const PRODUCT_LIST_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags,+images"
