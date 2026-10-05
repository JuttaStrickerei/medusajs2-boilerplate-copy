import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"
import { PRODUCT_GRID } from "@modules/products/components/product-preview/card-styles"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import { ArrowRight } from "@components/icons"

interface FeaturedProductsProps {
  region: HttpTypes.StoreRegion
}

export default async function FeaturedProducts({
  region,
}: FeaturedProductsProps) {
  // Die 8 neuesten Produkte (= aktuelle Kollektion); ohne „order“ kämen sie
  // in Anlage-Reihenfolge, also die ältesten zuerst
  const { response } = await listProducts({
    pageParam: 1,
    queryParams: {
      limit: 8,
      order: "-created_at",
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
          {/* Ohne isFeatured: unter dem Hero lädt nichts mit Priorität */}
          {products.map((product) => (
            <ProductPreview
              key={product.id}
              product={product}
              region={region}
              className="animate-fade-in-up"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
