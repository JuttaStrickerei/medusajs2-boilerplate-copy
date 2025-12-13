"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import { Heart, Trash, ShoppingBag } from "@components/icons"
import { useWishlist } from "@lib/context/wishlist-context"

interface WishlistDropdownProps {
  isOpen: boolean
}

export default function WishlistDropdown({ isOpen }: WishlistDropdownProps) {
  const { items, removeFromWishlist } = useWishlist()
  const isEmpty = items.length === 0

  return (
    <div
      className={`
        absolute top-full right-0 pt-3 w-[320px]
        transition-all duration-200 ease-out
        ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}
      `}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100">
          <h3 className="font-serif text-lg font-medium text-stone-800">
            Wunschliste
            {items.length > 0 && (
              <span className="text-stone-500 font-sans text-sm font-normal ml-2">
                ({items.length} {items.length === 1 ? 'Artikel' : 'Artikel'})
              </span>
            )}
          </h3>
        </div>

        {/* Content */}
        <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
          {isEmpty ? (
            <div className="px-5 py-10 text-center">
              <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart size={24} className="text-stone-400" />
              </div>
              <p className="text-stone-600 mb-1">Ihre Wunschliste ist leer</p>
              <p className="text-sm text-stone-400">
                Speichern Sie Ihre Lieblingsprodukte
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {items.slice(0, 4).map((item) => (
                <div key={item.id} className="px-5 py-3 flex gap-3">
                  {/* Thumbnail */}
                  <LocalizedClientLink
                    href={`/products/${item.handle}`}
                    className="relative w-14 h-14 flex-shrink-0 bg-stone-100 rounded-lg overflow-hidden"
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={20} className="text-stone-300" />
                      </div>
                    )}
                  </LocalizedClientLink>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <LocalizedClientLink
                      href={`/products/${item.handle}`}
                      className="text-sm font-medium text-stone-800 hover:text-stone-600 transition-colors line-clamp-2"
                    >
                      {item.title}
                    </LocalizedClientLink>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-center"
                    aria-label="Entfernen"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
              
              {items.length > 4 && (
                <div className="px-5 py-2 text-center">
                  <span className="text-xs text-stone-500">
                    + {items.length - 4} weitere Artikel
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="px-5 py-4 bg-stone-50 border-t border-stone-100">
            <LocalizedClientLink href="/wishlist" className="block">
              <Button variant="primary" fullWidth>
                Wunschliste ansehen
              </Button>
            </LocalizedClientLink>
          </div>
        )}
      </div>
    </div>
  )
}

