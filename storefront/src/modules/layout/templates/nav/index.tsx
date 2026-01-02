import { Suspense } from "react"
import { listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import WishlistButton from "@modules/layout/components/wishlist-button"
import SideMenu from "@modules/layout/components/side-menu"
import SearchButton from "@modules/search/components/search-button"
import { Search, User, Heart, ShoppingBag } from "@components/icons"

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)
  const categories = await listCategories()
  const { collections } = await listCollections()

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      {/* Main Navigation */}
      <header className="relative bg-white/95 backdrop-blur-md border-b border-stone-200">
        <nav className="content-container">
          <div className="flex items-center justify-between h-16 small:h-20">
            {/* Left Navigation - Desktop */}
            <div className="hidden small:flex items-center space-x-8 flex-1">
              {collections && collections.length > 0 && (
                <div className="relative group">
                  <LocalizedClientLink
                    href="/store"
                    className="text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors flex items-center gap-1 relative group"
                  >
                    Kollektionen
                    <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-stone-800 transition-all duration-300 group-hover:w-full" />
                  </LocalizedClientLink>
                  {/* Dropdown */}
                  <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-white rounded-xl shadow-lg border border-stone-200 py-2 min-w-[200px]">
                      <LocalizedClientLink
                        href="/store"
                        className="block px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors font-medium border-b border-stone-100"
                      >
                        Alle Kollektionen
                      </LocalizedClientLink>
                      {collections.map((collection) => (
                        <LocalizedClientLink
                          key={collection.id}
                          href={`/collections/${collection.handle}`}
                          className="block px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors"
                        >
                          {collection.title}
                        </LocalizedClientLink>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {categories && categories.length > 0 && (
                <div className="relative group">
                  <button className="text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors flex items-center gap-1">
                    Kategorien
                    <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {/* Dropdown */}
                  <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-white rounded-xl shadow-lg border border-stone-200 py-2 min-w-[200px]">
                      {categories.slice(0, 8).map((category) => (
                        <LocalizedClientLink
                          key={category.id}
                          href={`/categories/${category.handle}`}
                          className="block px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors"
                        >
                          {category.name}
                        </LocalizedClientLink>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <LocalizedClientLink
                href="/about"
                className="text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors relative group"
              >
                Über uns
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-stone-800 transition-all duration-300 group-hover:w-full" />
              </LocalizedClientLink>
            </div>

            {/* Mobile Menu */}
            <div className="flex small:hidden">
              <SideMenu regions={regions} collections={collections} />
            </div>

            {/* Center Logo */}
            <div className="flex items-center justify-center flex-1 small:flex-none">
              <LocalizedClientLink href="/" className="text-center group">
                <div className="font-serif text-xl small:text-2xl font-medium text-stone-800 tracking-tight group-hover:text-stone-600 transition-colors">
                  Strickerei Jutta
                </div>
                <div className="text-[10px] small:text-xs text-stone-500 tracking-[0.2em] uppercase">
                  seit 1965
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
