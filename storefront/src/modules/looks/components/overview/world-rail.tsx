"use client"

import { Children, useEffect, useRef, useState, type ReactNode } from "react"

import { ChevronRight } from "@components/icons"
import { shouldReduceMotion } from "@lib/utils"

type WorldRailProps = {
  /** aria-label der Liste, z. B. „Looks in Beere & Bordeaux“ */
  label: string
  listId: string
  listClassName: string
  children: ReactNode
}

type RailState = {
  thumbWidth: number
  thumbLeft: number
  atStart: boolean
  atEnd: boolean
}

const ARROW =
  "hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--welt-accent)] ring-1 ring-black/10 transition-[box-shadow,opacity] hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--welt-focus)] disabled:pointer-events-none disabled:opacity-40 tablet:inline-flex"

/**
 * Liste der Looks einer Farbwelt: unter 1024px eine wischbare Reihe mit
 * Fortschrittsbalken (ab 768px auch Pfeile), ab 1024px ein Raster (nur CSS).
 * Die Kacheln kommen fertig vom Server als children.
 */
export default function WorldRail({
  label,
  listId,
  listClassName,
  children,
}: WorldRailProps) {
  const listRef = useRef<HTMLUListElement>(null)
  // Startwert ohne Messung: gleich auf Server und Client (keine Hydration-Warnung)
  const [rail, setRail] = useState<RailState>(() => ({
    thumbWidth: 100 / Math.max(1, Children.count(children)),
    thumbLeft: 0,
    atStart: true,
    atEnd: false,
  }))

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    let frame = 0

    const measure = () => {
      frame = 0
      const { scrollLeft, scrollWidth, clientWidth } = list
      if (!scrollWidth) return
      const next: RailState = {
        thumbWidth: Math.min(100, (clientWidth / scrollWidth) * 100),
        thumbLeft: (scrollLeft / scrollWidth) * 100,
        atStart: scrollLeft <= 1,
        atEnd: scrollLeft >= scrollWidth - clientWidth - 1,
      }
      setRail((prev) =>
        prev.thumbWidth === next.thumbWidth &&
        prev.thumbLeft === next.thumbLeft &&
        prev.atStart === next.atStart &&
        prev.atEnd === next.atEnd
          ? prev
          : next
      )
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    list.addEventListener("scroll", schedule, { passive: true })
    const resize = new ResizeObserver(schedule)
    resize.observe(list)

    return () => {
      list.removeEventListener("scroll", schedule)
      resize.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  // Eine Karte samt Abstand weiter
  const step = (direction: 1 | -1) => {
    const list = listRef.current
    const card = list?.querySelector<HTMLElement>(":scope > li")
    if (!list || !card) return
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0
    list.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: shouldReduceMotion() ? "auto" : "smooth",
    })
  }

  return (
    <>
      <ul
        id={listId}
        ref={listRef}
        aria-label={label}
        className={listClassName}
      >
        {children}
      </ul>
      <div className="mt-3 flex items-center gap-3 small:hidden">
        <div
          aria-hidden
          className="relative h-0.5 flex-1 rounded-full bg-[color:var(--welt-track)]"
        >
          <div
            className="absolute inset-y-0 rounded-full bg-[color:var(--welt-ink)]"
            style={{
              left: `${rail.thumbLeft}%`,
              width: `${rail.thumbWidth}%`,
            }}
          />
        </div>
        <button
          type="button"
          aria-label="Vorherige Looks"
          aria-controls={listId}
          disabled={rail.atStart}
          onClick={() => step(-1)}
          className={ARROW}
        >
          <ChevronRight size={18} aria-hidden className="rotate-180" />
        </button>
        <button
          type="button"
          aria-label="Nächste Looks"
          aria-controls={listId}
          disabled={rail.atEnd}
          onClick={() => step(1)}
          className={ARROW}
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
    </>
  )
}
