import { Metadata } from "next"

import { listCollections } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PageBreadcrumb from "@modules/common/components/page-breadcrumb"
import PageHeader from "@modules/common/components/page-header"
import TileImage from "@modules/common/components/tile-image"
import {
  CARD_BODY,
  CARD_MAT,
  CARD_MEDIA,
  CARD_NAME,
  CARD_NAME_UNDERLINE,
  PRODUCT_GRID_WIDE,
} from "@modules/products/components/product-preview/card-styles"

export const metadata: Metadata = {
  title: "Alle Kollektionen",
  description: "Entdecken Sie alle Kollektionen der Strickerei Jutta.",
}

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function CollectionsOverviewPage(props: Params) {
  const params = await props.params

  // Load all collections
  const { collections } = await listCollections()

  const hasCollections = collections && collections.length > 0

  return (
    <div className="bg-stone-50 min-h-screen">
      <PageBreadcrumb items={[{ label: "Kollektionen" }]} />
      <PageHeader
        title="Alle Kollektionen"
        meta="Entdecken Sie alle Kollektionen der Strickerei Jutta."
      />

      <div className="content-container pb-12 small:pb-16">
        {/* Kollektionen oder leerer Zustand */}
        {hasCollections ? (
          <section aria-label="Kollektionen">
            <ul className={PRODUCT_GRID_WIDE}>
              {collections.map((collection) => {
                const image = collection.metadata?.image as string | undefined
                return (
                  <li key={collection.id}>
                    <LocalizedClientLink
                      href={`/collections/${collection.handle}`}
                      className={CARD_MAT}
                    >
                      <div className={CARD_MEDIA}>
                        <TileImage src={image} />
                      </div>
                      <div className={CARD_BODY}>
                        <h2 className={CARD_NAME}>
                          <span className={CARD_NAME_UNDERLINE}>
                            {collection.title}
                          </span>
                        </h2>
                      </div>
                    </LocalizedClientLink>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
              <span className="w-10 h-10 rounded-full border border-stone-300 bg-white/80" />
            </div>
            <h2 className="font-serif text-2xl font-medium text-stone-800 mb-3">
              Keine Kollektionen verfügbar
            </h2>
            <p className="text-stone-600 max-w-md mx-auto">
              Aktuell sind keine Kollektionen verfügbar. Bitte schauen Sie zu
              einem späteren Zeitpunkt wieder vorbei oder stöbern Sie direkt in
              unseren Produkten.
            </p>
            <div className="mt-6">
              <LocalizedClientLink
                href="/store"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium
                           rounded-full bg-stone-800 text-white hover:bg-stone-700 transition-colors"
              >
                Alle Produkte ansehen
              </LocalizedClientLink>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
