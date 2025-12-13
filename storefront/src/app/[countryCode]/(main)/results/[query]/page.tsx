import { Metadata } from "next"
import { searchProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
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
  }
}

export default async function SearchResultsPage({ params }: Props) {
  const { countryCode, query } = await params
  const decodedQuery = decodeURIComponent(query)

  const region = await getRegion(countryCode)
  const products = await searchProducts(decodedQuery, countryCode)

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="content-container py-3">
          <nav className="flex text-sm text-stone-500">
            <LocalizedClientLink href="/" className="hover:text-stone-800 transition-colors">
              Home
            </LocalizedClientLink>
            <span className="mx-2">/</span>
            <LocalizedClientLink href="/store" className="hover:text-stone-800 transition-colors">
              Shop
            </LocalizedClientLink>
            <span className="mx-2">/</span>
            <span className="text-stone-800">Suche: "{decodedQuery}"</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="content-container py-8 small:py-12">
          <h1 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-2">
            Suchergebnisse
          </h1>
          <p className="text-stone-600">
            {products.length} {products.length === 1 ? "Ergebnis" : "Ergebnisse"} für "{decodedQuery}"
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="content-container py-8 small:py-12">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4 small:gap-6">
            {region && products.map((product) => (
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
              Wir konnten keine Produkte für "{decodedQuery}" finden. 
              Versuchen Sie einen anderen Suchbegriff oder stöbern Sie in unseren Kategorien.
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

