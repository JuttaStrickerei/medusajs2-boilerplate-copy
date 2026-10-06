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
import PageBreadcrumb from "@modules/common/components/page-breadcrumb"
import JsonLd from "@modules/common/components/json-ld"
import { Badge } from "@components/ui"
import { Sparkles, RefreshCw, Shield } from "@components/icons"
import { getProductPrice } from "@lib/util/get-product-price"
import { getBaseURL } from "@lib/util/env"
import { ViewItem } from "@modules/common/components/analytics"
import { gaCurrency, productToItem } from "@lib/util/analytics"

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

  // Produkte hängen an höchstens einer (flachen) Kategorie
  const category = product.categories?.[0]

  // --- Structured data (JSON-LD) for search engines ---
  const baseUrl = getBaseURL()
  const productUrl = `${baseUrl}/${countryCode}/products/${product.handle}`
  const { cheapestPrice } = getProductPrice({ product })

  const images = [
    product.thumbnail,
    ...(product.images?.map((img) => img.url) ?? []),
  ].filter((url): url is string => Boolean(url))

  // Mirror the add-to-cart availability logic: purchasable if any variant is
  // unmanaged, backorderable, or has stock.
  const isPurchasable = (product.variants ?? []).some(
    (v) =>
      !v.manage_inventory ||
      v.allow_backorder ||
      (v.inventory_quantity ?? 0) > 0
  )

  // One Offer when every variant costs the same, otherwise an AggregateOffer
  // with the live price range (amounts already include tax, like the UI).
  const variantPrices = (product.variants ?? [])
    .map(
      (v) =>
        v.calculated_price?.calculated_amount_with_tax ??
        v.calculated_price?.calculated_amount
    )
    .filter((n): n is number => typeof n === "number")
  const lowPrice = variantPrices.length ? Math.min(...variantPrices) : null
  const highPrice = variantPrices.length ? Math.max(...variantPrices) : null
  const singleSku =
    product.variants?.length === 1 ? product.variants[0].sku ?? null : null
  const availability = isPurchasable
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock"

  const productSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    brand: { "@type": "Brand", name: "Strickerei Jutta" },
    ...(product.description || product.subtitle
      ? { description: product.description || product.subtitle }
      : {}),
    ...(singleSku ? { sku: singleSku } : {}),
    ...(images.length ? { image: images } : {}),
    ...(product.material ? { material: product.material } : {}),
    ...(cheapestPrice && lowPrice !== null && highPrice !== null
      ? {
          offers:
            lowPrice === highPrice
              ? {
                  "@type": "Offer",
                  url: productUrl,
                  priceCurrency: cheapestPrice.currency_code.toUpperCase(),
                  price: lowPrice,
                  availability,
                  itemCondition: "https://schema.org/NewCondition",
                }
              : {
                  "@type": "AggregateOffer",
                  url: productUrl,
                  priceCurrency: cheapestPrice.currency_code.toUpperCase(),
                  lowPrice,
                  highPrice,
                  offerCount: variantPrices.length,
                  availability,
                  itemCondition: "https://schema.org/NewCondition",
                },
        }
      : {}),
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Startseite",
        item: `${baseUrl}/${countryCode}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Alle Produkte",
        item: `${baseUrl}/${countryCode}/store`,
      },
      ...(category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: category.name,
              item: `${baseUrl}/${countryCode}/categories/${category.handle}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: category ? 4 : 3,
        name: product.title,
        item: productUrl,
      },
    ],
  }

  return (
    <div className="bg-stone-50 min-h-screen">
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ViewItem
        item={productToItem(product)}
        currency={gaCurrency(region.currency_code)}
      />
      <PageBreadcrumb
        items={[
          { label: "Alle Produkte", href: "/store" },
          // Wie im Menü „Shop“: über die Kategorie, nicht die Kollektion
          ...(category
            ? [{ label: category.name, href: `/categories/${category.handle}` }]
            : []),
          { label: product.title },
        ]}
      />

      {/* Main Product Section */}
      <section className="bg-white">
        <div
          className="content-container py-6 small:py-10"
          data-testid="product-container"
        >
          <div className="grid grid-cols-1 medium:grid-cols-[1fr_1fr] gap-6 medium:gap-10 large:gap-14 items-start">
            {/* Image Gallery */}
            <div className="medium:sticky medium:top-20 medium:self-start">
              <ImageGallery
                images={product?.images || []}
                thumbnail={product?.thumbnail}
                title={product.title}
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="space-y-3">
                {(product.collection ||
                  (product.tags && product.tags.length > 0)) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.collection && (
                      <LocalizedClientLink
                        href={`/collections/${product.collection.handle}`}
                      >
                        <Badge
                          variant="secondary"
                          className="hover:bg-stone-200 transition-colors text-xs"
                        >
                          {product.collection.title}
                        </Badge>
                      </LocalizedClientLink>
                    )}
                    {product.tags &&
                      product.tags.length > 0 &&
                      product.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="bg-stone-100 text-stone-600 text-xs"
                        >
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
                  text="14 Tage Widerrufsrecht"
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

function TrustBadgeSmall({
  icon,
  text,
}: {
  icon: React.ReactNode
  text: string
}) {
  return (
    <div className="flex items-center gap-2.5 text-stone-500">
      <span className="text-stone-400">{icon}</span>
      <span className="text-xs">{text}</span>
    </div>
  )
}

export default ProductTemplate
