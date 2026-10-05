import { Metadata } from "next"
import Image from "next/image"

import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PageBreadcrumb from "@modules/common/components/page-breadcrumb"
import PageHeader from "@modules/common/components/page-header"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import {
  CARD_BODY,
  CARD_MAT,
  CARD_MEDIA,
  CARD_NAME,
  CARD_NAME_UNDERLINE,
  CARD_SIZES,
  PRODUCT_GRID_WIDE,
} from "@modules/products/components/product-preview/card-styles"

export const metadata: Metadata = {
  title: "Alle Kategorien",
  description: "Entdecken Sie alle Kategorien der Strickerei Jutta.",
}

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function CategoriesOverviewPage(props: Params) {
  const params = await props.params

  // Load all categories
  const categories = await listCategories({
    // Navigation only needs names/handles; the default field set pulls every
    // product of every category into each page.
    fields: "id,name,handle,metadata,*parent_category",
  })

  // Nur Hauptkategorien anzeigen (ohne Parent)
  const rootCategories = categories.filter(
    (category) => !category.parent_category
  )
  const hasCategories = rootCategories.length > 0

  return (
    <div className="bg-stone-50 min-h-screen">
      <PageBreadcrumb items={[{ label: "Kategorien" }]} />
      <PageHeader
        title="Alle Kategorien"
        meta="Entdecken Sie alle Kategorien der Strickerei Jutta."
      />

      <div className="content-container pb-12 small:pb-16">
        {/* Kategorien oder leerer Zustand */}
        {hasCategories ? (
          <section aria-label="Kategorien">
            <ul className={PRODUCT_GRID_WIDE}>
              {rootCategories.map((category) => {
                const image = category.metadata?.image as string | undefined
                return (
                  <li key={category.id}>
                    <LocalizedClientLink
                      href={`/categories/${category.handle}`}
                      className={CARD_MAT}
                    >
                      <div className={CARD_MEDIA}>
                        {image ? (
                          <Image
                            src={image}
                            alt={category.name}
                            fill
                            sizes={CARD_SIZES}
                            className="object-cover"
                          />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-stone-300">
                            <PlaceholderImage size={24} aria-hidden />
                          </span>
                        )}
                      </div>
                      <div className={CARD_BODY}>
                        <h2 className={CARD_NAME}>
                          <span className={CARD_NAME_UNDERLINE}>
                            {category.name}
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
              Keine Kategorien verfügbar
            </h2>
            <p className="text-stone-600 max-w-md mx-auto">
              Aktuell sind keine Kategorien verfügbar. Bitte schauen Sie zu
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
