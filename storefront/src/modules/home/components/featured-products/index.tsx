import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"
import { PRODUCT_GRID } from "@modules/products/components/product-preview/card-styles"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import { ArrowRight } from "@components/icons"

interface FeaturedProductsProps {
  collections: HttpTypes.StoreCollection[]
  region: HttpTypes.StoreRegion
}

export default async function FeaturedProducts({
  collections,
  region,
}: FeaturedProductsProps) {
  // Get featured products (latest 8 products)
  const { response } = await listProducts({
    pageParam: 1,
    queryParams: {
      limit: 8,
    },
    regionId: region.id,
  })

  const products = response.products

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className="section-container bg-white">
      <div className="content-container">
        {/* Section Header */}
        <div className="flex flex-col small:flex-row small:items-end small:justify-between gap-4 mb-10 small:mb-12">
          <div>
            <p className="text-sm text-stone-500 tracking-[0.15em] uppercase mb-2">
              Aktuelle Kollektion
            </p>
            <h2 className="font-serif text-3xl small:text-4xl font-medium text-stone-800">
              Ausgewählte Produkte
            </h2>
          </div>
          <LocalizedClientLink href="/store">
            <Button variant="secondary" rightIcon={<ArrowRight size={16} />}>
              Alle Produkte
            </Button>
          </LocalizedClientLink>
        </div>

        {/* Raster und Abstände wie die Produktlisten; 4 Spalten ab 1024px,
            damit die 8 Produkte zwei volle Reihen ergeben */}
        <div className={`${PRODUCT_GRID} small:grid-cols-4`}>
          {products.map((product, index) => (
            <ProductPreview
              key={product.id}
              product={product}
              region={region}
              isFeatured={index < 4}
              className="animate-fade-in-up"
            />
          ))}
        </div>

        {/* Collections Quick Links */}
        {collections && collections.length > 0 && (
          <div className="mt-16 pt-16 border-t border-stone-200">
            <div className="text-center mb-8">
              <h3 className="font-serif text-2xl font-medium text-stone-800">
                Entdecken Sie unsere Kollektionen
              </h3>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {collections.slice(0, 6).map((collection) => (
                <LocalizedClientLink
                  key={collection.id}
                  href={`/collections/${collection.handle}`}
                  className="px-6 py-3 bg-stone-100 rounded-full text-sm font-medium text-stone-700 hover:bg-stone-800 hover:text-white transition-all duration-200"
                >
                  {collection.title}
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
