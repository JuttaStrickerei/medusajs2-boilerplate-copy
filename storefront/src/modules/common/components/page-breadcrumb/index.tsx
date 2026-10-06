import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { cn } from "@lib/utils"

export type Crumb = {
  label: string
  /** ohne href: aktuelle Seite (letzter Eintrag) */
  href?: string
}

/** ab so vielen Einträgen (inkl. „Startseite“) fehlt am Handy die aktuelle Seite */
const LONG_TRAIL = 4

/**
 * Einheitliche Brotkrümel-Leiste unter der Navigation: weiße Leiste mit
 * „Startseite / … / aktuelle Seite“. „Startseite“ wird immer vorangestellt.
 *
 * Der Schrägstrich steht im selben <li> wie der folgende Eintrag, damit er
 * beim Umbruch mit ihm wandert und nie allein am Zeilenende hängt. Lange
 * Pfade (Produktseite) blenden die aktuelle Seite unter 768px sichtbar aus –
 * die Überschrift nennt sie ohnehin –, damit die Leiste einzeilig bleibt;
 * Screenreader lesen sie weiter vor.
 */
export default function PageBreadcrumb({ items }: { items: Crumb[] }) {
  const crumbs: Crumb[] = [{ label: "Startseite", href: "/" }, ...items]
  const isLongTrail = crumbs.length >= LONG_TRAIL

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
              <li
                key={`${crumb.label}-${i}`}
                className={cn(
                  "flex items-center gap-x-2",
                  isLast && isLongTrail && "max-tablet:sr-only"
                )}
              >
                {i > 0 && (
                  <span aria-hidden className="text-stone-300">
                    /
                  </span>
                )}
                {crumb.href && !isLast ? (
                  // -my-2 py-2: größere Tippfläche, ohne die Leiste zu erhöhen
                  <LocalizedClientLink
                    href={crumb.href}
                    className="-my-2 py-2 transition-colors hover:text-stone-800"
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
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
