import type { LookSeason } from "@modules/looks/lib/seasons"

/**
 * Gemeinsames Modell für Desktop-Navigation und Handy-Menü, damit beide
 * dieselben Einträge zeigen. Rein, ohne Abfragen. Hrefs ohne Ländercode
 * (LocalizedClientLink setzt ihn).
 */

export type NavLink = {
  label: string
  href: string
  /** leise Zusatzangabe rechts, z. B. „20 Looks“ */
  meta?: string
}

export type NavSectionKey = "looks" | "shop"

export type NavSection = {
  key: NavSectionKey
  label: string
  /** Ziel der Beschriftung selbst (Übersicht des Bereichs) */
  href: string
  /** leer = einfacher Link ohne Untermenü */
  links: NavLink[]
  /** erster Eintrag ist die Übersicht („Alle Produkte“), abgesetzt */
  leadIsOverview: boolean
}

type NavSeason = Pick<LookSeason, "title" | "href" | "lookCount">
type NavCategoryLink = { name: string; handle: string | null }

export const ABOUT_LINK: NavLink = { label: "Über uns", href: "/about" }

export const buildNavSections = (
  seasons: NavSeason[],
  categories: NavCategoryLink[]
): NavSection[] => [
  {
    key: "looks",
    label: "Shop the Look",
    href: "/looks",
    // neueste Saison zuerst; die aktuelle führt auf /looks
    links: seasons.map((season) => ({
      label: season.title,
      href: season.href,
      meta: `${season.lookCount} ${season.lookCount === 1 ? "Look" : "Looks"}`,
    })),
    leadIsOverview: false,
  },
  {
    key: "shop",
    label: "Shop",
    href: "/store",
    links: [
      { label: "Alle Produkte", href: "/store" },
      // Handles unverändert übernehmen (z. B. „Kleider“ mit großem K)
      ...categories
        .filter((c) => !!c.handle)
        .map((c) => ({ label: c.name, href: `/categories/${c.handle}` })),
    ],
    leadIsOverview: true,
  },
]

const COUNTRY_PREFIX = /^\/[a-z]{2}(?=\/|$)/i

/** /at/looks → /looks, /at → / */
export const stripCountry = (pathname: string): string =>
  pathname.replace(COUNTRY_PREFIX, "") || "/"

export type ActiveKey = NavSectionKey | "about"

// Kollektionen erreicht man jetzt über „Shop“
const SECTION_PREFIXES: Record<ActiveKey, string[]> = {
  looks: ["/looks"],
  shop: ["/store", "/categories", "/products", "/collections"],
  about: ["/about"],
}

export const isSectionActive = (key: ActiveKey, path: string): boolean =>
  SECTION_PREFIXES[key].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  )

export const isExact = (href: string, path: string): boolean => href === path
