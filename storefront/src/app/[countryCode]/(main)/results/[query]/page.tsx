import { Metadata } from "next"
import { searchProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PageBreadcrumb from "@modules/common/components/page-breadcrumb"
import PageHeader from "@modules/common/components/page-header"
import { PRODUCT_GRID_WIDE } from "@modules/products/components/product-preview/card-styles"
import { Search } from "@components/icons"

type Props = {
  params: Promise<{ countryCode: string; query: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { query } = await params
  const decodedQuery = decodeURIComponent(query)

  return {
    title: `Suchergebnisse für "${decodedQuery}"`,
    description: `Finden Sie Produkte für "${decodedQuery}" bei Strickerei Jutta`,
    robots: { index: false, follow: false },
  }
}

export default async function SearchResultsPage({ params }: Props) {
  const { countryCode, query } = await params
  const decodedQuery = decodeURIComponent(query)

  const region = await getRegion(countryCode)
  const products = await searchProducts(decodedQuery, countryCode)

  return (
    <div className="bg-stone-50 min-h-screen">
      <PageBreadcrumb
        items={[
          { label: "Alle Produkte", href: "/store" },
          { label: `Suche: "${decodedQuery}"` },
        ]}
      />
      <PageHeader
        title="Suchergebnisse"
        meta={`${products.length} ${
          products.length === 1 ? "Ergebnis" : "Ergebnisse"
        } für "${decodedQuery}"`}
      />

      {/* Results */}
      <div className="content-container pb-12 small:pb-16">
        {products.length > 0 ? (
          <div className={PRODUCT_GRID_WIDE}>
            {region &&
              products.map((product) => (
                <ProductPreview
                  key={product.id}
                  product={product}
                  region={region}
                />
              ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-stone-400" />
            </div>
            <h2 className="font-serif text-2xl font-medium text-stone-800 mb-3">
              Keine Ergebnisse gefunden
            </h2>
            <p className="text-stone-600 mb-6 max-w-md mx-auto">
              Wir konnten keine Produkte für "{decodedQuery}" finden. Versuchen
              Sie einen anderen Suchbegriff oder stöbern Sie in unseren
              Kategorien.
            </p>
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors font-medium"
            >
              Alle Produkte ansehen
            </LocalizedClientLink>
          </div>
        )}
      </div>
    </div>
  )
}
