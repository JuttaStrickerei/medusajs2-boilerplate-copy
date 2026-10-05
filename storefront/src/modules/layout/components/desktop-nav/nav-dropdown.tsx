"use client"

import { useEffect, useRef } from "react"
import type { FocusEvent, KeyboardEvent, PointerEvent } from "react"

import { ChevronDown } from "@components/icons"
import { cn } from "@lib/utils"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { isExact, type NavSection } from "@modules/layout/lib/nav-model"

type NavLabelLinkProps = {
  href: string
  label: string
  /** Bereich der aktuellen Seite: dunkler, Unterstrich bleibt */
  isActive: boolean
  isCurrentPage: boolean
}

/** Oberste Beschriftung (auch „Über uns“); der Unterstrich wächst beim Zeigen */
export function NavLabelLink({
  href,
  label,
  isActive,
  isCurrentPage,
}: NavLabelLinkProps) {
  return (
    <LocalizedClientLink
      href={href}
      aria-current={isCurrentPage ? "page" : undefined}
      className={cn(
        "group/label relative rounded-sm text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900",
        isActive ? "text-stone-900" : "text-stone-600 hover:text-stone-800"
      )}
    >
      {label}
      <span
        aria-hidden
        className={cn(
          "absolute -bottom-1 left-0 h-px w-full origin-left bg-stone-800 transition-transform duration-300 motion-reduce:transition-none",
          isActive
            ? "scale-x-100"
            : "scale-x-0 group-hover/label:scale-x-100 group-hover/item:scale-x-100"
        )}
      />
    </LocalizedClientLink>
  )
}

type NavDropdownProps = {
  section: NavSection
  /** Pfad ohne Ländercode */
  path: string
  isActive: boolean
  isOpen: boolean
  onHoverOpen: () => void
  onHoverLeave: () => void
  onToggle: () => void
  onClose: () => void
}

/**
 * Bereich mit Untermenü nach dem WAI-Muster „Disclosure Navigation“:
 * Beschriftung führt zur Übersicht, der Pfeil daneben öffnet die Liste.
 * Kein role="menu": es sind gewöhnliche Links. Geschlossene Listen sind
 * `inert` und `invisible`, also weder fokussierbar noch vorgelesen.
 */
export default function NavDropdown({
  section,
  path,
  isActive,
  isOpen,
  onHoverOpen,
  onHoverLeave,
  onToggle,
  onClose,
}: NavDropdownProps) {
  const itemRef = useRef<HTMLLIElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLUListElement>(null)
  // Pfeil nach unten: erst öffnen, nach dem Rendern den ersten Link fokussieren
  const focusFirstOnOpen = useRef(false)
  const panelId = `nav-panel-${section.key}`

  useEffect(() => {
    if (!isOpen || !focusFirstOnOpen.current) {
      return
    }
    focusFirstOnOpen.current = false
    panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus()
  }, [isOpen])

  // Nur echte Maus: Touch und Stift tippen auf Beschriftung oder Pfeil
  const handlePointerEnter = (e: PointerEvent) => {
    if (e.pointerType === "mouse") {
      onHoverOpen()
    }
  }

  const handlePointerLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") {
      onHoverLeave()
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      e.preventDefault()
      onClose()
      toggleRef.current?.focus()
    }
  }

  const handleToggleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown") {
      return
    }
    e.preventDefault()
    if (isOpen) {
      panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus()
      return
    }
    focusFirstOnOpen.current = true
    onToggle()
  }

  // Fokus wandert aus dem Bereich (Tab über den letzten Link hinaus):
  // schließen. Ohne Ziel (Klick auf leere Fläche, Fensterwechsel) bleibt es
  // offen; Klicks außerhalb schließt DesktopNav.
  const handleBlur = (e: FocusEvent) => {
    const next = e.relatedTarget as Node | null
    if (isOpen && next && !itemRef.current?.contains(next)) {
      onClose()
    }
  }

  return (
    <li
      ref={itemRef}
      className="group/item relative flex items-center"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      <NavLabelLink
        href={section.href}
        label={section.label}
        isActive={isActive}
        isCurrentPage={isExact(section.href, path)}
      />
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`${section.label} – Untermenü`}
        onClick={onToggle}
        onKeyDown={handleToggleKeyDown}
        className="-ml-1 -mr-1 flex h-11 w-8 items-center justify-center rounded-md text-stone-500 transition-colors hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
      >
        <ChevronDown
          size={16}
          aria-hidden
          className={cn(
            "transition-transform duration-200 motion-reduce:transition-none",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Das Polster oben ist eine unsichtbare Brücke, damit die Maus das
          Feld erreicht; es hängt das Feld 8px unter die Kopfzeile
          ((80 − 44) / 2 + 8 = 26px).
          Beim Öffnen wird nur die Deckkraft überblendet: Die Sichtbarkeit
          springt sofort um, sonst ließe sich der erste Link nicht gleich
          fokussieren. Beim Schließen bleibt sie bis zum Ende sichtbar,
          damit das Ausblenden zu sehen ist; `inert` nimmt die Links aber
          sofort aus der Tab-Reihenfolge (Escape, dann gleich Tab). */}
      <div
        id={panelId}
        inert={!isOpen}
        className={cn(
          "absolute left-0 top-full z-50 pt-[26px] duration-200 motion-reduce:transition-none",
          isOpen
            ? "visible opacity-100 transition-opacity"
            : "invisible opacity-0 transition-[opacity,visibility]"
        )}
      >
        <ul
          ref={panelRef}
          className={cn(
            "min-w-[220px] rounded-xl border border-stone-200 bg-white py-2 shadow-lg transition-transform duration-200 ease-out motion-reduce:transition-none",
            isOpen ? "translate-y-0" : "-translate-y-1"
          )}
        >
          {section.links.map((link, i) => {
            const isCurrent = isExact(link.href, path)
            const isLead = section.leadIsOverview && i === 0
            return (
              <li key={link.href}>
                <LocalizedClientLink
                  href={link.href}
                  onClick={onClose}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap px-4 py-2 text-sm transition-colors hover:bg-stone-50 hover:text-stone-800 focus-visible:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900",
                    isCurrent ? "font-medium text-stone-900" : "text-stone-600",
                    isLead && "mb-1 border-b border-stone-100 font-medium",
                    link.meta && "flex items-baseline justify-between gap-8"
                  )}
                >
                  {link.label}
                  {link.meta && (
                    <span className="text-xs tabular-nums text-stone-500">
                      {link.meta}
                    </span>
                  )}
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>
      </div>
    </li>
  )
}
