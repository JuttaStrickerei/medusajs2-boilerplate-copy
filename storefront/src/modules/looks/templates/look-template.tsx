import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import type { StoreLook } from "@lib/data/looks"
import { getBaseURL } from "@lib/util/env"
import { productToItem } from "@lib/util/analytics"
import { getPhotoNotes } from "@lib/util/look-photo-notes"
import JsonLd from "@modules/common/components/json-ld"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ViewItemList } from "@modules/common/components/analytics"
import { ChevronRight } from "@components/icons"
import LookItemsActions from "../components/look-items-actions"
import ProductTabs from "@modules/products/components/product-tabs"

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
  const photoNotes = getPhotoNotes(look.metadata)

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

      <div className="content-container py-6 small:py-10">
        <nav
          aria-label="Brotkrümelnavigation"
          className="mb-6 flex items-center gap-1 text-sm text-stone-500"
        >
          <LocalizedClientLink href="/looks" className="hover:text-stone-800">
            Looks
          </LocalizedClientLink>
          <ChevronRight size={14} />
          <span className="text-stone-800">{look.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 medium:grid-cols-2 medium:gap-12">
          {/* Bilder */}
          <div className="flex flex-col gap-4 medium:sticky medium:top-24 medium:self-start">
            {images.length > 0 ? (
              images.map((url, index) => (
                <figure key={url} className="flex flex-col gap-2">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-stone-100">
                    <Image
                      src={url}
                      alt={index === 0 ? look.title : `${look.title} – Bild ${index + 1}`}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 1279px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  {/* Hinweis unter dem Foto, damit er nichts vom Bild verdeckt */}
                  {photoNotes.has(url) && (
                    <figcaption className="px-1 text-xs leading-snug text-stone-500">
                      {photoNotes.get(url)}
                    </figcaption>
                  )}
                </figure>
              ))
            ) : (
              <div className="aspect-[2/3] rounded-xl bg-gradient-to-br from-stone-100 to-stone-200" />
            )}
          </div>

          {/* Teile */}
          <div className="flex flex-col gap-6">
            <header>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                Shop the Look
              </p>
              <h1 className="mt-2 font-serif text-2xl small:text-3xl medium:text-4xl font-medium text-stone-800">
                {look.title}
              </h1>
              {look.description && (
                <p className="mt-3 whitespace-pre-line text-sm small:text-base text-stone-600">
                  {look.description}
                </p>
              )}
            </header>

            {products.length > 0 ? (
              <>
                <LookItemsActions
                  lookId={look.id}
                  lookTitle={look.title}
                  products={products}
                />
                {/* Dieselbe „Versand & Retouren“-Karte wie auf der Produktseite
                    (Wrapper nötig: im Flex-Container würde mx-auto sie schrumpfen) */}
                <div>
                  <ProductTabs product={products[0]} showDetails={false} />
                </div>
              </>
            ) : (
              <p className="text-stone-600">
                Die Teile dieses Looks sind derzeit nicht verfügbar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
