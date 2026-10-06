import { HttpTypes } from "@medusajs/types"
import type { LookSeason } from "@modules/looks/lib/seasons"
import { listProducts } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"
import { PRODUCT_GRID } from "@modules/products/components/product-preview/card-styles"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowRight } from "@components/icons"
import { toCardProduct } from "@modules/home/lib/card-product"
import { HOME_EYEBROW, HOME_H2 } from "../section-styles"

const FEATURED_COUNT = 8

interface FeaturedProductsProps {
  region: HttpTypes.StoreRegion
  /** Produkte, die schon weiter oben stehen (z. B. Teile von „Shop the Look“) */
  excludeIds?: string[]
  /** Saison für die Dachzeile; null = ohne Saison */
  season?: Pick<LookSeason, "collectionId" | "title"> | null
}

export default async function FeaturedProducts({
  region,
  excludeIds = [],
  season = null,
}: FeaturedProductsProps) {
  // Die neuesten Produkte (= aktuelle Kollektion); ohne „order“ kämen sie in
  // Anlage-Reihenfolge, also die ältesten zuerst. Ein paar mehr laden, damit
  // nach dem Weglassen der schon gezeigten Teile noch 8 bleiben.
  const excluded = new Set(excludeIds)
  const products = await listProducts({
    pageParam: 1,
    queryParams: {
      limit: FEATURED_COUNT + excluded.size,
      order: "-created_at",
    },
    regionId: region.id,
  })
    .then(({ response }) =>
      response.products
        .filter((product) => !excluded.has(product.id))
        .slice(0, FEATURED_COUNT)
    )
    .catch((error) => {
      console.error("home: failed to load featured products", error)
      return []
    })

  if (!products.length) {
    return null
  }

  // Die Saison nur nennen, wenn wirklich jedes Produkt aus ihr stammt (eine
  // neuere Kollektion ohne Looks käme sonst unter dem alten Namen). „Kollektion
  // Herbst/Winter 2026“ passt auch auf dem Handy in eine Zeile.
  const seasonTitle =
    season &&
    products.every((product) => product.collection_id === season.collectionId)
      ? season.title
      : null
  const eyebrow = seasonTitle
    ? `Kollektion ${seasonTitle}`
    : "Aktuelle Kollektion"

  return (
    <section
      aria-labelledby="ausgewaehlte-produkte-title"
      className="bg-white py-10 small:py-16"
    >
      <div className="content-container">
        {/* Kopf wie die Look-Abschnitte darüber */}
        <div className="mb-4 tablet:flex tablet:items-end tablet:justify-between tablet:gap-8 small:mb-7">
          <div>
            <p className={HOME_EYEBROW}>{eyebrow}</p>
            <h2
              id="ausgewaehlte-produkte-title"
              className={`mt-1.5 ${HOME_H2}`}
            >
              Ausgewählte Produkte
            </h2>
          </div>
          <LocalizedClientLink
            href="/store"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            Alle Produkte
            <ArrowRight size={16} aria-hidden />
          </LocalizedClientLink>
        </div>

        {/* Raster und Abstände wie die Produktlisten; 4 Spalten ab 1024px,
            damit die 8 Produkte zwei volle Reihen ergeben */}
        <div className={`${PRODUCT_GRID} small:grid-cols-4`}>
          {/* Ohne isFeatured: unter dem Hero lädt nichts mit Priorität */}
          {products.map((product) => (
            <ProductPreview
              key={product.id}
              // nur die Felder der Karte: sonst ~21 KB je Produkt im HTML
              product={toCardProduct(product)}
              region={region}
              className="animate-fade-in-up"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
