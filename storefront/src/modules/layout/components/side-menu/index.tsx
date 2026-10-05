"use client"

import { Fragment, useState } from "react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { useRouter, useParams, usePathname } from "next/navigation"
import { Dialog, Transition } from "@headlessui/react"
import { HttpTypes } from "@medusajs/types"
import { cn } from "@lib/utils"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "@modules/layout/components/country-select"
import {
  ABOUT_LINK,
  isExact,
  isSectionActive,
  stripCountry,
  type NavLink,
  type NavSection,
} from "@modules/layout/lib/nav-model"
import {
  Menu,
  Close,
  ChevronDown,
  ChevronRight,
  Search,
  User,
  Heart,
} from "@components/icons"

interface SideMenuProps {
  regions: HttpTypes.StoreRegion[] | null
  /** dieselben Bereiche wie die Desktop-Navigation */
  sections: NavSection[]
}

const CONTACT_LINK: NavLink = { label: "Kontakt", href: "/contact" }

export default function SideMenu({ regions, sections }: SideMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const countryToggle = useToggleState()
  const router = useRouter()
  const { countryCode } = useParams()
  const path = stripCountry(usePathname() ?? "/")

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
                            in 3. Generation
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
                      <form
                        onSubmit={handleSearch}
                        className="px-6 py-4 border-b border-stone-200"
                      >
                        <div className="relative">
                          <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                          />
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
                        {/* Main Navigation: wie die Desktop-Navigation */}
                        <nav aria-label="Hauptmenü" className="px-6">
                          <ul className="space-y-1">
                            {sections.map((section) => (
                              <li key={section.key}>
                                {section.links.length ? (
                                  <MenuAccordion
                                    section={section}
                                    path={path}
                                    onNavigate={closeMenu}
                                  />
                                ) : (
                                  <MenuLinkRow
                                    link={{
                                      label: section.label,
                                      href: section.href,
                                    }}
                                    path={path}
                                    onNavigate={closeMenu}
                                  />
                                )}
                              </li>
                            ))}
                            {[ABOUT_LINK, CONTACT_LINK].map((link) => (
                              <li key={link.href}>
                                <MenuLinkRow
                                  link={link}
                                  path={path}
                                  onNavigate={closeMenu}
                                />
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
                                    <span className="text-stone-500">
                                      {link.icon}
                                    </span>
                                  )}
                                  <span className="font-medium">
                                    {link.label}
                                  </span>
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
                            <CountrySelect
                              regions={regions}
                              toggleState={countryToggle}
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

type MenuRowProps = {
  path: string
  onNavigate: () => void
}

/** Hauptzeile mit Pfeil nach rechts (Über uns, Kontakt) */
function MenuLinkRow({
  link,
  path,
  onNavigate,
}: MenuRowProps & { link: NavLink }) {
  const isCurrent = isExact(link.href, path)
  return (
    <LocalizedClientLink
      href={link.href}
      onClick={onNavigate}
      aria-current={isCurrent ? "page" : undefined}
      className="flex items-center justify-between py-3 text-stone-700 hover:text-stone-900 transition-colors group"
    >
      <span className={cn("font-medium", isCurrent && "text-stone-900")}>
        {link.label}
      </span>
      <ChevronRight
        size={18}
        className="text-stone-400 group-hover:text-stone-600 group-hover:translate-x-1 transition-all"
      />
    </LocalizedClientLink>
  )
}

/**
 * Aufklappbarer Bereich (Shop the Look, Shop). Die ganze Zeile klappt nur
 * auf, sie führt nirgends hin: Der erste Link darunter ist die Übersicht.
 * Offen startet der Bereich der aktuellen Seite; das Menü wird bei jedem
 * Öffnen neu aufgebaut. Zugeklappte Links sind `invisible`, also nicht per
 * Tab erreichbar.
 */
function MenuAccordion({
  section,
  path,
  onNavigate,
}: MenuRowProps & { section: NavSection }) {
  const [isExpanded, setIsExpanded] = useState(() =>
    isSectionActive(section.key, path)
  )
  const panelId = `menu-panel-${section.key}`

  return (
    <>
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => setIsExpanded((open) => !open)}
        className="flex w-full min-h-12 items-center justify-between py-3 text-left text-stone-700 hover:text-stone-900 transition-colors"
      >
        <span className="font-medium">{section.label}</span>
        <ChevronDown
          size={18}
          aria-hidden
          className={cn(
            "text-stone-400 transition-transform duration-200 motion-reduce:transition-none",
            isExpanded && "rotate-180"
          )}
        />
      </button>
      {/* grid-rows 0fr → 1fr: weiches Auf- und Zuklappen ohne feste Höhe */}
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows,visibility] duration-300 ease-in-out motion-reduce:transition-none",
          isExpanded ? "grid-rows-[1fr]" : "invisible grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="mb-2 ml-1 border-l border-stone-200 pl-4">
            {section.links.map((link, i) => {
              const isCurrent = isExact(link.href, path)
              const isLead = section.leadIsOverview && i === 0
              return (
                <li key={link.href}>
                  <LocalizedClientLink
                    href={link.href}
                    onClick={onNavigate}
                    aria-current={isCurrent ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center justify-between gap-4 text-[15px] transition-colors hover:text-stone-900",
                      isCurrent
                        ? "font-medium text-stone-900"
                        : "text-stone-600",
                      isLead && "font-medium"
                    )}
                  >
                    {link.label}
                    {link.meta && (
                      <span className="text-xs font-normal tabular-nums text-stone-500">
                        {link.meta}
                      </span>
                    )}
                  </LocalizedClientLink>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </>
  )
}
