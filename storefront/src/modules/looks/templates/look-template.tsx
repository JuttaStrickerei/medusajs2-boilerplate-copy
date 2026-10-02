import { HttpTypes } from "@medusajs/types"
import type { StoreLook } from "@lib/data/looks"
import { getBaseURL } from "@lib/util/env"
import { productToItem } from "@lib/util/analytics"
import { getPhotoNotes } from "@lib/util/look-photo-notes"
import { sumLookPrices } from "@lib/util/look-price"
import { formatPrice } from "@lib/utils"
import JsonLd from "@modules/common/components/json-ld"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ViewItemList } from "@modules/common/components/analytics"
import LookGallery from "../components/look-gallery"
import LookItemsActions from "../components/look-items-actions"
import { RefreshCw, RotateCcw, Truck } from "@components/icons"

type LookTemplateProps = {
  look: StoreLook
  products: HttpTypes.StoreProduct[]
  countryCode: string
}

export default function LookTemplate({
  look,
  products,
  countryCode,
}: LookTemplateProps) {
  const baseUrl = getBaseURL()
  const lookUrl = `${baseUrl}/${countryCode}/looks/${look.handle}`
  const images = look.images?.length
    ? look.images
    : products
        .map((p) => p.thumbnail)
        .filter((url): url is string => !!url)
        .slice(0, 1)
  // Map → einfaches Objekt: Client-Komponenten bekommen nur serialisierbare Props
  const notes = Object.fromEntries(getPhotoNotes(look.metadata))

  // Kopfzeile: „3 Teile · zusammen € 210,00“ (günstigste Variante je Teil)
  const total = sumLookPrices(products)
  const pieceCount = products.length

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: look.title,
    url: lookUrl,
    ...(look.description ? { description: look.description } : {}),
    ...(images.length ? { image: images } : {}),
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.title,
      url: `${baseUrl}/${countryCode}/products/${product.handle}`,
    })),
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
        name: "Looks",
        item: `${baseUrl}/${countryCode}/looks`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: look.title,
        item: lookUrl,
      },
    ],
  }

  return (
    <div className="bg-stone-50 min-h-screen">
      <JsonLd data={itemListSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ViewItemList
        items={products.map((p) => productToItem(p))}
        listId={`look_${look.handle}`}
        listName={`Look: ${look.title}`}
      />

      <div className="content-container grid grid-cols-1 pb-10 pt-4 tablet:grid-cols-[minmax(0,1fr)_340px] tablet:grid-rows-[auto_1fr] tablet:items-start tablet:gap-x-8 tablet:pt-6 small:grid-cols-[minmax(0,1fr)_minmax(380px,420px)] small:gap-x-10 small:pb-12 small:pt-8 medium:grid-cols-[minmax(0,1fr)_400px] medium:gap-x-12 large:gap-x-16">
        <header className="tablet:col-start-2 tablet:row-start-1">
          <nav aria-label="Brotkrümelnavigation">
            <ol className="flex text-[11px] uppercase tracking-[0.16em] text-stone-500">
              <li>
                <LocalizedClientLink
                  href="/looks"
                  className="hover:text-stone-800"
                >
                  Looks
                </LocalizedClientLink>
              </li>
              <li aria-hidden className="mx-1.5 text-stone-300">
                /
              </li>
              <li>
                <span aria-current="page">{look.title}</span>
              </li>
            </ol>
          </nav>
          <h1 className="mt-1.5 font-serif text-[1.75rem] font-normal leading-9 text-stone-900 tablet:text-[2.25rem] tablet:leading-[2.6rem] small:text-4xl medium:text-[2.75rem] medium:leading-[1.1]">
            {look.title}
          </h1>
          {pieceCount > 0 && (
            <p
              data-testid="look-meta"
              className="mt-1 text-sm tabular-nums text-stone-600"
            >
              <a
                href="#look-teile"
                className="underline-offset-4 hover:underline"
              >
                {pieceCount} {pieceCount === 1 ? "Teil" : "Teile"}
              </a>
              {total && (
                <>
                  {" · "}
                  {pieceCount > 1 ? "zusammen " : ""}
                  {total.from ? "ab " : ""}
                  {formatPrice(total.amount, total.currency)}
                </>
              )}
            </p>
          )}
        </header>

        <div className="-mx-6 mt-4 self-start tablet:sticky tablet:top-[89px] tablet:col-start-1 tablet:row-span-2 tablet:row-start-1 tablet:mx-0 tablet:mt-0 small:top-[113px]">
          {images.length > 0 ? (
            <LookGallery images={images} title={look.title} notes={notes} />
          ) : (
            <div className="mx-6 aspect-[2/3] rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 tablet:mx-0" />
          )}
        </div>

        <div className="mt-3 min-w-0 self-start tablet:col-start-2 tablet:row-start-2 tablet:mt-6">
          {look.description && (
            <p className="mb-4 max-w-[46ch] whitespace-pre-line text-sm text-stone-600">
              {look.description}
            </p>
          )}

          {products.length > 0 ? (
            <LookItemsActions
              lookId={look.id}
              lookTitle={look.title}
              products={products}
            />
          ) : (
            <p className="text-stone-600">
              Die Teile dieses Looks sind derzeit nicht verfügbar.
            </p>
          )}

          {/* Kurzfassung der „Versand & Retouren“-Karte aus product-tabs
              (dieselben Aussagen; product-tabs ist "use client", daher hier
              als Text statt Import) */}
          <ul className="mt-6 space-y-1.5 border-t border-stone-200 pt-4 text-xs leading-5 text-stone-600">
            <li className="flex gap-2">
              <Truck
                size={14}
                aria-hidden
                className="mt-[3px] shrink-0 text-stone-400"
              />
              Lieferung in etwa 2 Wochen – Versand innerhalb Österreichs
            </li>
            <li className="flex gap-2">
              <RefreshCw
                size={14}
                aria-hidden
                className="mt-[3px] shrink-0 text-stone-400"
              />
              Passt nicht? Wir tauschen unkompliziert.
            </li>
            <li className="flex gap-2">
              <RotateCcw
                size={14}
                aria-hidden
                className="mt-[3px] shrink-0 text-stone-400"
              />
              14 Tage Widerrufsrecht ab Erhalt der Ware
            </li>
          </ul>
          <LocalizedClientLink
            href="/shipping"
            className="mt-2 inline-block text-xs text-stone-600 underline underline-offset-4 hover:text-stone-900"
          >
            Versand &amp; Rückgabe im Detail
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
