import React, { Suspense } from "react"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import ProductActionsWrapper from "./product-actions-wrapper"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Badge } from "@components/ui"
import { Sparkles, RefreshCw, Shield } from "@components/icons"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="content-container py-3">
          <nav className="flex items-center gap-2 text-xs text-stone-400 flex-wrap">
            <LocalizedClientLink href="/" className="hover:text-stone-700 transition-colors">
              Startseite
            </LocalizedClientLink>
            <span className="text-stone-300">/</span>
            <LocalizedClientLink href="/store" className="hover:text-stone-700 transition-colors">
              Alle Produkte
            </LocalizedClientLink>
            {product.collection && (
              <>
                <span className="text-stone-300">/</span>
                <LocalizedClientLink
                  href={`/collections/${product.collection.handle}`}
                  className="hover:text-stone-700 transition-colors"
                >
                  {product.collection.title}
                </LocalizedClientLink>
              </>
            )}
            <span className="text-stone-300">/</span>
            <span className="text-stone-600 line-clamp-1">{product.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <section className="bg-white">
        <div
          className="content-container py-6 small:py-10"
          data-testid="product-container"
        >
          <div className="grid grid-cols-1 medium:grid-cols-[1fr_1fr] gap-6 medium:gap-10 large:gap-14 items-start">
            {/* Image Gallery */}
            <div className="medium:sticky medium:top-20 medium:self-start">
              <ImageGallery images={product?.images || []} thumbnail={product?.thumbnail} />
            </div>

            {/* Product Info */}
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="space-y-3">
                {(product.collection || (product.tags && product.tags.length > 0)) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.collection && (
                      <LocalizedClientLink href={`/collections/${product.collection.handle}`}>
                        <Badge variant="secondary" className="hover:bg-stone-200 transition-colors text-xs">
                          {product.collection.title}
                        </Badge>
                      </LocalizedClientLink>
                    )}
                    {product.tags && product.tags.length > 0 && product.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="bg-stone-100 text-stone-600 text-xs">
                        {tag.value}
                      </Badge>
                    ))}
                  </div>
                )}

                <h1 className="font-serif text-2xl small:text-3xl font-medium text-stone-800 leading-tight">
                  {product.title}
                </h1>

                {product.subtitle && (
                  <p className="text-base text-stone-500">{product.subtitle}</p>
                )}

                {product.description && (
                  <p
                    className="text-sm text-stone-500 leading-relaxed whitespace-pre-line"
                    data-testid="product-description"
                  >
                    {product.description}
                  </p>
                )}
              </div>

              {/* Product Actions (Price, Variants, Add to Cart) */}
              <ProductOnboardingCta />
              <Suspense
                fallback={
                  <ProductActions
                    disabled={true}
                    product={product}
                    region={region}
                  />
                }
              >
                <ProductActionsWrapper id={product.id} region={region} />
              </Suspense>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 pt-5 border-t border-stone-200">
                <TrustBadgeSmall
                  icon={<Sparkles size={16} />}
                  text="Handgefertigt in Österreich"
                />
                <TrustBadgeSmall
                  icon={<Shield size={16} />}
                  text="100% Naturfasern"
                />
                <TrustBadgeSmall
                  icon={<RefreshCw size={16} />}
                  text="30 Tage Rückgaberecht"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Cards */}
      <section className="bg-stone-50 border-y border-stone-100">
        <div className="content-container py-10 small:py-14">
          <ProductTabs product={product} />
        </div>
      </section>

      {/* Related Products */}
      <section className="bg-white">
        <div
          className="content-container py-14 small:py-18"
          data-testid="related-products-container"
        >
          <div className="text-center mb-10">
            <p className="text-xs text-stone-400 tracking-[0.2em] uppercase mb-2">
              Das könnte Ihnen auch gefallen
            </p>
            <h2 className="font-serif text-2xl small:text-3xl font-medium text-stone-800">
              Ähnliche Produkte
            </h2>
          </div>
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </div>
      </section>
    </div>
  )
}

function TrustBadgeSmall({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-stone-500">
      <span className="text-stone-400">{icon}</span>
      <span className="text-xs">{text}</span>
    </div>
  )
}

export default ProductTemplate
