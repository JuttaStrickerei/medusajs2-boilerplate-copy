"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartDropdown from "@modules/layout/components/cart-dropdown"
import { ShoppingBag } from "@components/icons"
import { useCart } from "@lib/context/cart-context"

export default function CartButton() {
  const { cart, itemCount } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <LocalizedClientLink
        className="flex items-center justify-center w-10 h-10 rounded-full text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-all relative"
        href="/cart"
        data-testid="nav-cart-link"
        aria-label={`Warenkorb (${itemCount} Artikel)`}
      >
        <ShoppingBag size={20} />
        {itemCount > 0 && (
          <span 
            className="absolute -top-0.5 -right-0.5 bg-stone-800 text-white text-[10px] font-medium rounded-full h-5 w-5 flex items-center justify-center animate-scale-in"
            key={itemCount} // Force re-render animation on count change
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </LocalizedClientLink>

      {/* Cart Dropdown - Desktop */}
      <div className="hidden small:block">
        <CartDropdown cart={cart} isOpen={isOpen} />
      </div>
    </div>
  )
}
