import { Fragment } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export type Crumb = {
  label: string
  /** ohne href: aktuelle Seite (letzter Eintrag) */
  href?: string
}

/**
 * Einheitliche Brotkrümel-Leiste unter der Navigation: weiße Leiste mit
 * „Startseite / … / aktuelle Seite“. „Startseite“ wird immer vorangestellt.
 */
export default function PageBreadcrumb({ items }: { items: Crumb[] }) {
  const crumbs: Crumb[] = [{ label: "Startseite", href: "/" }, ...items]

  return (
    <div className="border-b border-stone-200 bg-white">
      <nav
        aria-label="Brotkrümelnavigation"
        className="content-container py-3 small:py-4"
      >
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 small:text-sm">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <Fragment key={`${crumb.label}-${i}`}>
                {i > 0 && (
                  <li aria-hidden className="text-stone-300">
                    /
                  </li>
                )}
                <li>
                  {crumb.href && !isLast ? (
                    <LocalizedClientLink
                      href={crumb.href}
                      className="transition-colors hover:text-stone-800"
                    >
                      {crumb.label}
                    </LocalizedClientLink>
                  ) : (
                    <span
                      aria-current={isLast ? "page" : undefined}
                      className="text-stone-800"
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              </Fragment>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
