import { HttpTypes } from "@medusajs/types"

// Admin: Produkt → Metadaten → Schlüssel "fertigung". Ohne Eintrag kein Hinweis.
const HINWEISE: Record<string, string> = {
  auf_bestellung: "Wird nach Ihrer Bestellung frisch gestrickt · 2 Wochen · 14 Tage Widerrufsrecht",
}

export default function FertigungHinweis({
  product,
  soldOut,
}: {
  product: HttpTypes.StoreProduct
  soldOut: boolean
}) {
  const hinweis = HINWEISE[String(product.metadata?.fertigung ?? "")]
  if (!hinweis || soldOut) return null

  return (
    <p
      className="text-sm text-stone-700 bg-stone-100 rounded-lg px-3 py-2"
      data-testid="product-fertigung-hinweis"
    >
      {hinweis}
    </p>
  )
}
