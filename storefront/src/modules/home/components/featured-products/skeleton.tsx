import { PRODUCT_GRID } from "@modules/products/components/product-preview/card-styles"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"
import { HOME_EYEBROW, HOME_H2 } from "../section-styles"

const PLACEHOLDER_CARDS = 8

/** Platzhalter für „Ausgewählte Produkte“, gleicher Kopf und gleiches Raster */
export default function FeaturedProductsSkeleton() {
  return (
    <div className="bg-white py-10 small:py-16">
      <p role="status" className="sr-only">
        Produkte werden geladen …
      </p>
      <div aria-hidden className="content-container">
        <div className="mb-4 tablet:flex tablet:items-end tablet:justify-between tablet:gap-8 small:mb-7">
          <div>
            <p className={HOME_EYEBROW}>Aktuelle Kollektion</p>
            <p className={`mt-1.5 ${HOME_H2}`}>Ausgewählte Produkte</p>
          </div>
          <span className="flex min-h-11 items-center">
            <span className="h-3.5 w-28 animate-pulse rounded bg-black/[0.06]" />
          </span>
        </div>
        <div className={`${PRODUCT_GRID} small:grid-cols-4`}>
          {Array.from({ length: PLACEHOLDER_CARDS }, (_, i) => (
            <SkeletonProductPreview key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
