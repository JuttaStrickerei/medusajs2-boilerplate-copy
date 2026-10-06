import { HttpTypes } from "@medusajs/types"

import { getHomeLooks, listProductsInOrder } from "@lib/data/home"
import { productToItem } from "@lib/util/analytics"
import { cn } from "@lib/utils"
import { ViewItemList } from "@modules/common/components/analytics"
import { toCardProduct } from "@modules/home/lib/card-product"
import {
  HOME_SPOTLIGHT_LOOK,
  pickSpotlight,
} from "@modules/home/lib/home-looks"
import LookTile from "@modules/looks/components/overview/look-tile"
import styles from "@modules/looks/components/overview/looks-overview.module.css"
import { toGaItem } from "@modules/looks/lib/overview"
import ProductPreview from "@modules/products/components/product-preview"
import { SPOTLIGHT_GRID } from "../section-styles"
import SpotlightSummary from "./spotlight-summary"

export const SPOTLIGHT_LIST_ID = "home_shop_the_look"
export const SPOTLIGHT_LIST_NAME = "Startseite – Shop the Look"
const TITLE_ID = "shop-the-look-title"

// Spaltenbreiten wie das Raster unten: 2 auf dem Handy, 4 ab 768px, ab
// 1440px 4 von 5 Spalten (die fünfte hält die Summe). Bis 1440px wachsen die
// Spalten mit: (Breite − Seitenränder − 3 Lücken) / 4
const SPOTLIGHT_TILE_SIZES =
  "(min-width:1440px) 256px, (min-width:1280px) calc(25vw - 34px), (min-width:1024px) calc(25vw - 27px), (min-width:768px) calc(25vw - 24px), calc(50vw - 30px)"

/**
 * „Shop the Look“: ein Look neben seinen Teilen, jedes mit eigenem Preis,
 * auf der Farbe seiner Welt. Darunter Summe, Weg zum Look und die drei
 * Schritte. Ohne passenden Look oder ohne Teile rendert er nichts.
 */
export default async function LookSpotlight({
  countryCode,
  region,
}: {
  countryCode: string
  region: HttpTypes.StoreRegion
}) {
  const { overview, looks } = await getHomeLooks(countryCode)
  const spotlight = pickSpotlight({
    overview,
    looks,
    preferred: HOME_SPOTLIGHT_LOOK,
  })
  if (!spotlight) {
    return null
  }

  const products = await listProductsInOrder(countryCode, spotlight.productIds)
  if (!products?.length) {
    return null
  }

  const tile = { ...spotlight.tile, position: 1 }
  const gaItems = [
    toGaItem(tile),
    ...products.map((product, i) => ({
      ...productToItem(product),
      index: i + 2,
    })),
  ]

  return (
    <section
      id="shop-the-look"
      aria-labelledby={TITLE_ID}
      style={spotlight.band.style}
      className="bg-[color:var(--welt-bg)] py-10 small:py-16"
    >
      <div className="content-container">
        <header className={cn("mb-5 small:mb-8", styles.reveal)}>
          <p className="text-xs uppercase leading-4 tracking-[0.18em] text-[color:var(--welt-muted)]">
            Shop the Look
          </p>
          <h2
            id={TITLE_ID}
            className="mt-1.5 font-serif text-[1.75rem] font-normal leading-[2.125rem] text-[color:var(--welt-ink)] small:text-4xl small:leading-[2.75rem]"
          >
            {tile.title}
          </h2>
          {tile.mood && (
            <p className="mt-1 text-pretty text-[15px] leading-[22px] text-[color:var(--welt-text)] small:text-base">
              {tile.mood}
            </p>
          )}
          <p className="mt-1 text-pretty text-[15px] leading-[22px] text-[color:var(--welt-text)] small:text-base">
            Jedes Teil gibt es auch einzeln – mit eigenem Preis.
          </p>
        </header>

        <div className="large:grid large:grid-cols-5 large:gap-x-6">
          <ul
            aria-label={`Look ${tile.name} und seine Teile`}
            className={SPOTLIGHT_GRID}
          >
            <LookTile
              look={tile}
              isLead={false}
              isMirrored={false}
              loading="lazy"
              listId={SPOTLIGHT_LIST_ID}
              listName={SPOTLIGHT_LIST_NAME}
              // Breite aus dem Raster statt der Reihen-Breiten
              className="w-auto max-w-none tablet:w-auto"
              sizes={SPOTLIGHT_TILE_SIZES}
            />
            {products.map((product) => (
              <li key={product.id}>
                <ProductPreview
                  product={toCardProduct(product)}
                  region={region}
                />
              </li>
            ))}
          </ul>
          <SpotlightSummary
            tile={tile}
            extraCount={spotlight.extraCount}
            listId={SPOTLIGHT_LIST_ID}
            listName={SPOTLIGHT_LIST_NAME}
          />
        </div>
        <ViewItemList
          listId={SPOTLIGHT_LIST_ID}
          listName={SPOTLIGHT_LIST_NAME}
          items={gaItems}
        />
      </div>
    </section>
  )
}
