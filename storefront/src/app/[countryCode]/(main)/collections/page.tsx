import { Metadata } from "next"

import { listCollections } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

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
      <div className="content-container py-8 small:py-12">
        {/* Page Header */}
        <header className="mb-8 small:mb-10">
          <h1 className="font-serif text-2xl small:text-3xl medium:text-4xl font-medium text-stone-800">
            Alle Kollektionen
          </h1>
          <p className="mt-3 text-sm small:text-base text-stone-600 max-w-2xl">
            Entdecken Sie die Kollektionen der Strickerei Jutta und finden Sie
            die passende Auswahl für Ihren Stil.
          </p>
        </header>

        {/* Collections Grid or Empty State */}
        {hasCollections ? (
          <section aria-label="Kollektionen">
            <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4 small:gap-6">
              {collections.map((collection) => (
                <li key={collection.id}>
                  <LocalizedClientLink
                    href={`/collections/${collection.handle}`}
                    className="group block h-full"
                  >
                    <article
                      className="bg-white rounded-xl overflow-hidden border border-stone-200/60 shadow-sm
                                 hover:shadow-lg hover:border-stone-200 transition-all duration-300 hover:-translate-y-1
                                 flex flex-col h-full"
                    >
                      {/* Collection Title */}
                      <div className="px-4 pt-4 pb-2 text-center">
                        <h2 className="text-sm small:text-base font-medium text-stone-800 line-clamp-2">
                          {collection.title}
                        </h2>
                      </div>

                      {/* Placeholder Image Area */}
                      <div
                        className="relative aspect-[4/5] mx-3 mb-4 rounded-lg overflow-hidden
                                   bg-gradient-to-br from-stone-100 to-stone-200
                                   border border-stone-200/70"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2 text-stone-500">
                            <span className="inline-flex h-10 w-10 rounded-full border border-stone-300 bg-white/70 shadow-sm" />
                            <span className="text-[11px] tracking-[0.18em] uppercase">
                              Kollektion
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </LocalizedClientLink>
                </li>
              ))}
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

