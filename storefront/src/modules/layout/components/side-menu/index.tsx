"use client"

import { Fragment, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Dialog, Transition } from "@headlessui/react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "@modules/layout/components/country-select"
import { Menu, Close, ChevronRight, Search, User, Heart } from "@components/icons"

interface SideMenuProps {
  regions: HttpTypes.StoreRegion[] | null
}

export default function SideMenu({ regions }: SideMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { countryCode } = useParams()

  const openMenu = () => setIsOpen(true)
  const closeMenu = () => setIsOpen(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/${countryCode}/results/${encodeURIComponent(searchQuery)}`)
      closeMenu()
      setSearchQuery("")
    }
  }

  const navigationLinks = [
    { href: "/store", label: "Alle Produkte" },
    { href: "/collections", label: "Kollektionen" },
    { href: "/categories", label: "Kategorien" },
    { href: "/about", label: "Über uns" },
    { href: "/contact", label: "Kontakt" },
  ]

  const accountLinks = [
    { href: "/account", label: "Mein Konto", icon: <User size={20} /> },
    { href: "/wishlist", label: "Wunschliste", icon: <Heart size={20} /> },
    { href: "/account/orders", label: "Bestellungen" },
  ]

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={openMenu}
        className="flex items-center justify-center w-10 h-10 rounded-full text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-all"
        aria-label="Menü öffnen"
      >
        <Menu size={22} />
      </button>

      {/* Side Menu Dialog */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeMenu}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm" />
          </Transition.Child>

          {/* Panel */}
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-out duration-300"
                  enterFrom="-translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in duration-200"
                  leaveFrom="translate-x-0"
                  leaveTo="-translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-sm">
                    <div className="flex h-full flex-col bg-white shadow-xl">
                      {/* Header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
                        <LocalizedClientLink 
                          href="/" 
                          onClick={closeMenu}
                          className="text-center"
                        >
                          <div className="font-serif text-xl font-medium text-stone-800">
                            Strickerei Jutta
                          </div>
                          <div className="text-[10px] text-stone-500 tracking-[0.2em] uppercase">
                            seit 1965
                          </div>
                        </LocalizedClientLink>
                        <button
                          onClick={closeMenu}
                          className="flex items-center justify-center w-10 h-10 rounded-full text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-all"
                          aria-label="Menü schließen"
                        >
                          <Close size={22} />
                        </button>
                      </div>

                      {/* Search */}
                      <form onSubmit={handleSearch} className="px-6 py-4 border-b border-stone-200">
                        <div className="relative">
                          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Suchen..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-stone-100 border-0 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
                          />
                        </div>
                      </form>

                      {/* Navigation */}
                      <div className="flex-1 overflow-y-auto py-4">
                        {/* Main Navigation */}
                        <nav className="px-6">
                          <p className="text-xs text-stone-400 uppercase tracking-wider mb-3">
                            Shop
                          </p>
                          <ul className="space-y-1">
                            {navigationLinks.map((link) => (
                              <li key={link.href}>
                                <LocalizedClientLink
                                  href={link.href}
                                  onClick={closeMenu}
                                  className="flex items-center justify-between py-3 text-stone-700 hover:text-stone-900 transition-colors group"
                                >
                                  <span className="font-medium">{link.label}</span>
                                  <ChevronRight 
                                    size={18} 
                                    className="text-stone-400 group-hover:text-stone-600 group-hover:translate-x-1 transition-all" 
                                  />
                                </LocalizedClientLink>
                              </li>
                            ))}
                          </ul>
                        </nav>

                        {/* Divider */}
                        <div className="my-4 mx-6 h-px bg-stone-200" />

                        {/* Account Links */}
                        <nav className="px-6">
                          <p className="text-xs text-stone-400 uppercase tracking-wider mb-3">
                            Konto
                          </p>
                          <ul className="space-y-1">
                            {accountLinks.map((link) => (
                              <li key={link.href}>
                                <LocalizedClientLink
                                  href={link.href}
                                  onClick={closeMenu}
                                  className="flex items-center gap-3 py-3 text-stone-700 hover:text-stone-900 transition-colors"
                                >
                                  {link.icon && (
                                    <span className="text-stone-500">{link.icon}</span>
                                  )}
                                  <span className="font-medium">{link.label}</span>
                                </LocalizedClientLink>
                              </li>
                            ))}
                          </ul>
                        </nav>
                      </div>

                      {/* Footer */}
                      <div className="border-t border-stone-200 px-6 py-4">
                        {regions && regions.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">
                              Land / Region
                            </p>
                            <CountrySelect 
                              regions={regions} 
                              toggleState={{ state: isOpen, close: closeMenu }}
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-center gap-6 text-sm text-stone-500">
                          <LocalizedClientLink 
                            href="/help" 
                            onClick={closeMenu}
                            className="hover:text-stone-800 transition-colors"
                          >
                            Hilfe
                          </LocalizedClientLink>
                          <LocalizedClientLink 
                            href="/faq" 
                            onClick={closeMenu}
                            className="hover:text-stone-800 transition-colors"
                          >
                            FAQ
                          </LocalizedClientLink>
                          <LocalizedClientLink 
                            href="/shipping" 
                            onClick={closeMenu}
                            className="hover:text-stone-800 transition-colors"
                          >
                            Versand
                          </LocalizedClientLink>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
