"use client"

import { useWishlist } from "@lib/context/wishlist-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import { Heart, Trash, ShoppingBag, ArrowRight } from "@components/icons"

export default function WishlistTemplate() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist()
  const isEmpty = items.length === 0

  return (
    <div className="py-12">
      <div className="content-container">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-2">
            Wunschliste
          </h1>
          <p className="text-stone-600">
            {isEmpty 
              ? "Speichern Sie Ihre Lieblingsprodukte für später"
              : `${items.length} ${items.length === 1 ? 'Artikel' : 'Artikel'} gespeichert`
            }
          </p>
        </div>

        {isEmpty ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
              <Heart size={36} className="text-stone-400" />
            </div>
            <h2 className="font-serif text-xl font-medium text-stone-800 mb-2">
              Ihre Wunschliste ist leer
            </h2>
            <p className="text-stone-500 mb-8 max-w-sm mx-auto">
              Entdecken Sie unsere Kollektionen und speichern Sie Ihre Favoriten mit dem Herz-Symbol.
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
            {/* Clear All Button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={clearWishlist}
                className="text-sm text-stone-500 hover:text-red-500 transition-colors flex items-center gap-2"
              >
                <Trash size={16} />
                Alle entfernen
              </button>
            </div>

            {/* Wishlist Grid */}
            <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4 small:gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden group hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <LocalizedClientLink
                    href={`/products/${item.handle}`}
                    className="block relative aspect-[4/5] bg-stone-100 overflow-hidden"
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={40} className="text-stone-300" />
                      </div>
                    )}
                    
                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        removeFromWishlist(item.id)
                      }}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-white transition-all"
                      aria-label="Von Wunschliste entfernen"
                    >
                      <Heart size={18} filled />
                    </button>
                  </LocalizedClientLink>

                  {/* Info */}
                  <div className="p-4">
                    <LocalizedClientLink href={`/products/${item.handle}`}>
                      <h3 className="font-medium text-stone-800 line-clamp-2 group-hover:text-stone-600 transition-colors">
                        {item.title}
                      </h3>
                    </LocalizedClientLink>
                    
                    <div className="mt-3">
                      <LocalizedClientLink 
                        href={`/products/${item.handle}`}
                        className="text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors flex items-center gap-1"
                      >
                        Zum Produkt
                        <ArrowRight size={14} />
                      </LocalizedClientLink>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="mt-12 text-center">
              <LocalizedClientLink href="/store">
                <Button variant="secondary">
                  Weiter shoppen
                </Button>
              </LocalizedClientLink>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

