import { Metadata } from "next"

import { listLooks } from "@lib/data/looks"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import LookCard from "@modules/looks/components/look-card"

export const metadata: Metadata = {
  title: "Shop the Look",
  description:
    "Kombinierte Outfits der Strickerei Jutta – entdecken Sie abgestimmte Looks und kaufen Sie das ganze Outfit oder einzelne Teile.",
}

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function LooksOverviewPage(props: Params) {
  const params = await props.params
  const looks = await listLooks()

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="content-container py-8 small:py-12">
        <header className="mb-8 small:mb-10">
          <h1 className="font-serif text-2xl small:text-3xl medium:text-4xl font-medium text-stone-800">
            Shop the Look
          </h1>
          <p className="mt-3 text-sm small:text-base text-stone-600 max-w-2xl">
            Abgestimmte Outfits aus unserer Strickerei – kaufen Sie den ganzen
            Look mit einem Klick oder wählen Sie einzelne Teile.
          </p>
        </header>

        {looks.length > 0 ? (
          <section aria-label="Looks">
            <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4 small:gap-6">
              {looks.map((look) => (
                <li key={look.id}>
                  <LookCard look={look} />
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className="py-20 text-center">
            <h2 className="font-serif text-2xl font-medium text-stone-800 mb-3">
              Noch keine Looks verfügbar
            </h2>
            <p className="text-stone-600 max-w-md mx-auto">
              Unsere ersten Looks sind in Arbeit. Stöbern Sie in der
              Zwischenzeit gerne in unseren Produkten.
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
