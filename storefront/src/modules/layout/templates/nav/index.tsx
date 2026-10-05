import { Suspense } from "react"
import { listRegions } from "@lib/data/regions"
import { listNavCategories } from "@lib/data/categories"
import { getLookSeasonIndex } from "@lib/data/look-seasons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import DesktopNav from "@modules/layout/components/desktop-nav"
import WishlistButton from "@modules/layout/components/wishlist-button"
import SideMenu from "@modules/layout/components/side-menu"
import { buildNavSections } from "@modules/layout/lib/nav-model"
import SearchButton from "@modules/search/components/search-button"
import { User, Heart, ShoppingBag } from "@components/icons"

export default async function Nav() {
  // Parallel statt nacheinander; Kategorien und Saisons sind 60 s gecacht
  const [regions, categories, { index }] = await Promise.all([
    listRegions(),
    listNavCategories(),
    getLookSeasonIndex(),
  ])
  const sections = buildNavSections(index.seasons, categories)

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      {/* Main Navigation */}
      <header className="relative bg-white/95 backdrop-blur-md border-b border-stone-200">
        <nav aria-label="Hauptnavigation" className="content-container">
          <div className="relative flex items-center justify-between h-16 small:h-20">
            {/* Left Navigation - Desktop */}
            <DesktopNav sections={sections} />

            {/* Mobile Menu */}
            <div className="flex small:hidden">
              <SideMenu regions={regions} sections={sections} />
            </div>

            {/* Center Logo */}
            {/* FIX: Keep the logo visually centered across all viewport widths */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
              <LocalizedClientLink href="/" className="text-center group pointer-events-auto">
                <div className="font-serif text-xl small:text-2xl font-medium text-stone-800 tracking-tight group-hover:text-stone-600 transition-colors">
                  Strickerei Jutta
                </div>
                <div className="hidden small:block text-xs text-stone-500 tracking-[0.2em] uppercase">
                  in 3. Generation
                </div>
              </LocalizedClientLink>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center justify-end gap-2 small:gap-4 flex-1">
              {/* Search - Desktop */}
              <div className="hidden small:block">
                <SearchButton />
              </div>

              {/* Wishlist - Desktop */}
              <div className="hidden small:block">
                <Suspense
                  fallback={
                    <LocalizedClientLink
                      className="flex items-center justify-center w-10 h-10 rounded-full text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-all relative"
                      href="/wishlist"
                      aria-label="Wunschliste"
                    >
                      <Heart size={20} />
                    </LocalizedClientLink>
                  }
                >
                  <WishlistButton />
                </Suspense>
              </div>

              {/* Account - Desktop */}
              <LocalizedClientLink
                href="/account"
                className="hidden small:flex items-center justify-center w-10 h-10 rounded-full text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-all"
                data-testid="nav-account-link"
                aria-label="Mein Konto"
              >
                <User size={20} />
              </LocalizedClientLink>

              {/* Cart */}
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="flex items-center justify-center w-10 h-10 rounded-full text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-all relative"
                    href="/cart"
                    data-testid="nav-cart-link"
                    aria-label="Warenkorb"
                  >
                    <ShoppingBag size={20} />
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>
          </div>
        </nav>
      </header>
    </div>
  )
}
