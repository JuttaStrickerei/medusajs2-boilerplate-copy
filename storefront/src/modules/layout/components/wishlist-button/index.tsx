"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import WishlistDropdown from "@modules/layout/components/wishlist-dropdown"
import { Heart } from "@components/icons"
import { useWishlist } from "@lib/context/wishlist-context"

export default function WishlistButton() {
  const { itemCount } = useWishlist()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <LocalizedClientLink
        className="flex items-center justify-center w-10 h-10 rounded-full text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-all relative"
        href="/wishlist"
        data-testid="nav-wishlist-link"
        aria-label={`Wunschliste (${itemCount} Artikel)`}
      >
        <Heart size={20} />
        {itemCount > 0 && (
          <span 
            className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-medium rounded-full h-5 w-5 flex items-center justify-center animate-scale-in"
            key={itemCount}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </LocalizedClientLink>

      {/* Wishlist Dropdown - Desktop */}
      <div className="hidden small:block">
        <WishlistDropdown isOpen={isOpen} />
      </div>
    </div>
  )
}

