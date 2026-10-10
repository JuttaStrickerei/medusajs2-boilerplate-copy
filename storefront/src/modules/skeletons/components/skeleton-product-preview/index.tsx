import {
  CARD_BODY,
  CARD_MAT,
} from "@modules/products/components/product-preview/card-styles"

// Platzhalter in der Form der Produktkarte, damit beim Laden nichts springt
const SkeletonProductPreview = () => {
  return (
    <div className={`${CARD_MAT} animate-pulse`}>
      <div className="aspect-[2/3] rounded-[4px] bg-stone-100" />
      <div className={CARD_BODY}>
        <div className="h-4 w-3/4 rounded bg-stone-100" />
        <div className="mt-2 h-4 w-1/3 rounded bg-stone-100" />
      </div>
    </div>
  )
}

export default SkeletonProductPreview
