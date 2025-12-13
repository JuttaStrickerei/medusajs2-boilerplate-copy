import React, { Suspense } from "react"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import ProductActionsWrapper from "./product-actions-wrapper"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Badge } from "@components/ui"
import { Sparkles, Truck, RefreshCw, Shield } from "@components/icons"

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
        <div className="content-container py-4">
          <nav className="flex items-center gap-2 text-sm text-stone-500 flex-wrap">
            <LocalizedClientLink href="/" className="hover:text-stone-800 transition-colors">
              Home
            </LocalizedClientLink>
            <span>/</span>
            <LocalizedClientLink href="/store" className="hover:text-stone-800 transition-colors">
              Shop
            </LocalizedClientLink>
            {product.collection && (
              <>
                <span>/</span>
                <LocalizedClientLink 
                  href={`/collections/${product.collection.handle}`}
                  className="hover:text-stone-800 transition-colors"
                >
                  {product.collection.title}
                </LocalizedClientLink>
              </>
            )}
            <span>/</span>
            <span className="text-stone-800 line-clamp-1">{product.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <section className="bg-white">
        <div
          className="content-container py-8 small:py-12"
          data-testid="product-container"
        >
          <div className="grid grid-cols-1 medium:grid-cols-2 gap-8 medium:gap-12 large:gap-16">
            {/* Image Gallery - Left Side */}
            <div className="medium:sticky medium:top-24 medium:self-start">
              <ImageGallery images={product?.images || []} />
            </div>

            {/* Product Info - Right Side */}
            <div className="space-y-8">
              {/* Product Header */}
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex items-center gap-2">
                  {product.collection && (
                    <LocalizedClientLink href={`/collections/${product.collection.handle}`}>
                      <Badge variant="secondary" className="hover:bg-stone-200 transition-colors">
                        {product.collection.title}
                      </Badge>
                    </LocalizedClientLink>
                  )}
                </div>

                {/* Title */}
                <h1 className="font-serif text-3xl small:text-4xl font-medium text-stone-800">
                  {product.title}
                </h1>

                {/* Subtitle/Description */}
                {product.subtitle && (
                  <p className="text-lg text-stone-600">{product.subtitle}</p>
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
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-stone-200">
                <TrustBadgeSmall
                  icon={<Sparkles size={18} />}
                  text="Handgefertigt in Österreich"
                />
                <TrustBadgeSmall
                  icon={<Shield size={18} />}
                  text="100% Naturfasern"
                />
                <TrustBadgeSmall
                  icon={<Truck size={18} />}
                  text="Kostenloser Versand ab €150"
                />
                <TrustBadgeSmall
                  icon={<RefreshCw size={18} />}
                  text="30 Tage Rückgaberecht"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Tabs */}
      <section className="bg-stone-50 border-y border-stone-200">
        <div className="content-container py-12 small:py-16">
          <ProductTabs product={product} />
        </div>
      </section>

      {/* Product Info (Additional Details) */}
      <section className="bg-white">
        <div className="content-container py-12 small:py-16">
          <ProductInfo product={product} />
        </div>
      </section>

      {/* Related Products */}
      <section className="bg-stone-50">
        <div
          className="content-container py-16 small:py-20"
          data-testid="related-products-container"
        >
          <div className="text-center mb-10">
            <p className="text-sm text-stone-500 tracking-[0.15em] uppercase mb-2">
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

// Small Trust Badge for Product Page
function TrustBadgeSmall({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-stone-600">
      <span className="text-stone-400">{icon}</span>
      <span className="text-sm">{text}</span>
    </div>
  )
}

export default ProductTemplate
