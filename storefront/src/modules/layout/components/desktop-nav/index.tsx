"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

import {
  ABOUT_LINK,
  isExact,
  isSectionActive,
  stripCountry,
  type NavSection,
  type NavSectionKey,
} from "@modules/layout/lib/nav-model"
import NavDropdown, { NavLabelLink } from "./nav-dropdown"

// Kurze Gnadenfrist, damit ein schräger Weg zur Liste sie nicht schließt
const HOVER_CLOSE_DELAY_MS = 150

type DesktopNavProps = {
  sections: NavSection[]
}

/**
 * Linke Navigation ab 1024px: [Shop the Look ▾] [Shop ▾] [Über uns].
 * Höchstens eine Liste ist offen. Öffnet per Maus-Hover, Pfeil-Klick oder
 * Tastatur; schließt bei Seitenwechsel, Klick außerhalb, Escape und wenn
 * der Fokus den Bereich verlässt.
 */
export default function DesktopNav({ sections }: DesktopNavProps) {
  const pathname = usePathname()
  const path = stripCountry(pathname ?? "/")
  const [openKey, setOpenKey] = useState<NavSectionKey | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // per Hover geöffnet: ein Klick auf den Pfeil hält die Liste dann offen,
  // statt sie unter dem Mauszeiger zu schließen
  const hoverOpenedKey = useRef<NavSectionKey | null>(null)

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const closeAll = () => {
    cancelClose()
    hoverOpenedKey.current = null
    setOpenKey(null)
  }

  // Seitenwechsel schließt alles
  useEffect(() => {
    hoverOpenedKey.current = null
    setOpenKey(null)
  }, [pathname])

  useEffect(() => {
    const timer = closeTimer
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    }
  }, [])

  // Klick oder Tippen außerhalb schließt; nur angemeldet, solange offen
  useEffect(() => {
    if (!openKey) {
      return
    }
    const handlePointerDown = (e: PointerEvent) => {
      if (!listRef.current?.contains(e.target as Node)) {
        hoverOpenedKey.current = null
        setOpenKey(null)
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [openKey])

  const handleHoverOpen = (key: NavSectionKey) => {
    cancelClose()
    if (openKey !== key) {
      hoverOpenedKey.current = key
      setOpenKey(key)
    }
  }

  const handleHoverLeave = (key: NavSectionKey) => {
    cancelClose()
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null
      hoverOpenedKey.current = null
      setOpenKey((current) => (current === key ? null : current))
    }, HOVER_CLOSE_DELAY_MS)
  }

  const handleToggle = (key: NavSectionKey) => {
    cancelClose()
    if (openKey === key && hoverOpenedKey.current === key) {
      hoverOpenedKey.current = null
      return
    }
    hoverOpenedKey.current = null
    setOpenKey(openKey === key ? null : key)
  }

  return (
    <ul ref={listRef} className="hidden flex-1 items-center gap-7 small:flex">
      {sections.map((section) =>
        section.links.length ? (
          <NavDropdown
            key={section.key}
            section={section}
            path={path}
            isActive={isSectionActive(section.key, path)}
            isOpen={openKey === section.key}
            onHoverOpen={() => handleHoverOpen(section.key)}
            onHoverLeave={() => handleHoverLeave(section.key)}
            onToggle={() => handleToggle(section.key)}
            onClose={closeAll}
          />
        ) : (
          // ohne Saisons: einfacher Link wie „Über uns“
          <li key={section.key}>
            <NavLabelLink
              href={section.href}
              label={section.label}
              isActive={isSectionActive(section.key, path)}
              isCurrentPage={isExact(section.href, path)}
            />
          </li>
        )
      )}
      <li>
        <NavLabelLink
          href={ABOUT_LINK.href}
          label={ABOUT_LINK.label}
          isActive={isSectionActive("about", path)}
          isCurrentPage={isExact(ABOUT_LINK.href, path)}
        />
      </li>
    </ul>
  )
}
