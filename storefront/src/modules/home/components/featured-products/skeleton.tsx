import { PRODUCT_GRID } from "@modules/products/components/product-preview/card-styles"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const PLACEHOLDER_CARDS = 8

/** Platzhalter für „Ausgewählte Produkte“, solange die Produkte laden */
export default function FeaturedProductsSkeleton() {
  return (
    <div className="section-container bg-white">
      <p role="status" className="sr-only">
        Produkte werden geladen …
      </p>
      <div aria-hidden className="content-container">
        <div className="mb-10 h-[76px] small:mb-12 small:h-[86px]" />
        <div className={`${PRODUCT_GRID} small:grid-cols-4`}>
          {Array.from({ length: PLACEHOLDER_CARDS }, (_, i) => (
            <SkeletonProductPreview key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
