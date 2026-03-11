"use client"

import { useWishlist } from "@lib/context/wishlist-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import { Heart, Trash, ShoppingBag, ArrowRight } from "@components/icons"

export default function WishlistContent() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist()
  const isEmpty = items.length === 0

  if (isEmpty) {
    return (
      <div className="p-8 small:p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-5">
          <Heart size={28} className="text-stone-400" />
        </div>
        <h2 className="font-serif text-lg font-medium text-stone-800 mb-2">
          Ihre Wunschliste ist leer
        </h2>
        <p className="text-sm text-stone-500 mb-6 max-w-xs mx-auto">
          Entdecken Sie unsere Kollektionen und speichern Sie Ihre Favoriten mit dem Herz-Symbol.
        </p>
        <LocalizedClientLink href="/store">
          <Button size="sm">
            Jetzt entdecken
            <ArrowRight size={16} className="ml-1.5" />
          </Button>
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="p-6 small:p-8">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-stone-500">
          {items.length} {items.length === 1 ? "Artikel" : "Artikel"} gespeichert
        </p>
        <button
          onClick={clearWishlist}
          className="text-sm text-stone-500 hover:text-red-500 transition-colors flex items-center gap-1.5"
        >
          <Trash size={14} />
          Alle entfernen
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 small:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-stone-100 overflow-hidden group hover:shadow-md transition-shadow"
          >
            <LocalizedClientLink
              href={`/products/${item.handle}`}
              className="block relative aspect-square bg-stone-50 overflow-hidden"
            >
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag size={32} className="text-stone-300" />
                </div>
              )}

              <button
                onClick={(e) => {
                  e.preventDefault()
                  removeFromWishlist(item.id)
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-white transition-all"
                aria-label="Von Wunschliste entfernen"
              >
                <Heart size={16} filled />
              </button>
            </LocalizedClientLink>

            <div className="p-3">
              <LocalizedClientLink href={`/products/${item.handle}`}>
                <h3 className="text-sm font-medium text-stone-800 line-clamp-2 group-hover:text-stone-600 transition-colors">
                  {item.title || "Produkt"}
                </h3>
              </LocalizedClientLink>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
