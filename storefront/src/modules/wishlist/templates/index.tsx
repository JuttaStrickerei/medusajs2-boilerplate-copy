"use client"

import { useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { useWishlist } from "@lib/context/wishlist-context"
import { listProducts } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PageBreadcrumb from "@modules/common/components/page-breadcrumb"
import PageHeader from "@modules/common/components/page-header"
import { PRODUCT_GRID_WIDE } from "@modules/products/components/product-preview/card-styles"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"
import { Button } from "@components/ui"
import { ArrowRight, Heart, Trash } from "@components/icons"

type WishlistTemplateProps = {
  region: HttpTypes.StoreRegion
  countryCode: string
}

export default function WishlistTemplate({
  region,
  countryCode,
}: WishlistTemplateProps) {
  const { items, clearWishlist } = useWishlist()
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const itemIds = items.map((i) => i.id)
  const itemIdsKey = itemIds.join(",")

  useEffect(() => {
    if (itemIds.length === 0) {
      setProducts([])
      return
    }

    // If all wishlisted IDs are already fetched, just prune.
    const haveIds = new Set(products.map((p) => p.id))
    const missingIds = itemIds.filter((id) => !haveIds.has(id))

    if (missingIds.length === 0) {
      setProducts((prev) => prev.filter((p) => itemIds.includes(p.id)))
      return
    }

    let cancelled = false
    setIsLoading(true)

    listProducts({
      countryCode,
      queryParams: {
        id: itemIds,
        limit: itemIds.length,
      },
    })
      .then(({ response }) => {
        if (cancelled) return
        setProducts(response.products)
      })
      .catch(() => {
        if (cancelled) return
        // Keep whatever we had; avoid destroying the visible grid on a transient failure.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIdsKey, countryCode])

  const isEmpty = items.length === 0
  const itemCount = items.length

  // Preserve wishlist order (addedAt DESC): the server returns rows sorted,
  // but `listProducts` may return products in a different order.
  const orderedProducts = itemIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is HttpTypes.StoreProduct => p !== undefined)

  return (
    <div className="min-h-screen bg-stone-50">
      <PageBreadcrumb items={[{ label: "Wunschliste" }]} />
      <PageHeader
        title="Wunschliste"
        meta={
          isEmpty
            ? "Speichern Sie Ihre Lieblingsprodukte für später"
            : `${itemCount} ${
                itemCount === 1 ? "Artikel" : "Artikel"
              } gespeichert`
        }
      />

      <div className="content-container pb-12 small:pb-16">
        {isEmpty ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-stone-200/70 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
              <Heart size={28} className="text-stone-400" />
            </div>
            <h2 className="font-serif text-xl font-medium text-stone-800 mb-2">
              Ihre Wunschliste ist leer
            </h2>
            <p className="text-stone-500 mb-8 max-w-sm mx-auto">
              Entdecken Sie unsere Kollektionen und speichern Sie Ihre Favoriten
              mit dem Herz-Symbol.
            </p>
            <LocalizedClientLink href="/store">
              <Button>
                Jetzt entdecken
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </LocalizedClientLink>
          </div>
        ) : (
          <>
            {/* Clear-all row */}
            <div className="mb-4 flex justify-end">
              <button
                onClick={clearWishlist}
                className="text-sm text-stone-500 hover:text-red-500 transition-colors flex items-center gap-2"
              >
                <Trash size={16} />
                Alle entfernen
              </button>
            </div>

            {/* Raster ohne Filterspalte, wie Suche und Ähnliche Produkte */}
            <div className={PRODUCT_GRID_WIDE}>
              {orderedProducts.length === 0 && isLoading
                ? Array.from({ length: itemCount }).map((_, i) => (
                    <SkeletonProductPreview key={i} />
                  ))
                : orderedProducts.map((product) => (
                    <ProductPreview
                      key={product.id}
                      product={product}
                      region={region}
                    />
                  ))}
            </div>

            {/* Continue Shopping */}
            <div className="mt-12 text-center">
              <LocalizedClientLink href="/store">
                <Button variant="secondary">Weiter shoppen</Button>
              </LocalizedClientLink>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
