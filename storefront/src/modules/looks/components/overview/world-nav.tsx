"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"

import { trackEvent } from "@lib/util/analytics"
import { shouldReduceMotion } from "@lib/utils"

export type NavWorld = {
  key: string
  name: string
  shortName: string
  count: number
  accent: string
  chipTint: string
  dots: string[]
}

type WorldNavProps = {
  worlds: NavWorld[]
  /** id des Seitenkopfs: ist er zu sehen, ist keine Welt aktiv */
  sentinelId: string
}

// Die Welt in der Bildschirmmitte gilt als aktiv
const SPY_MARGIN = "-45% 0px -50% 0px"
// Kopf gilt als verlassen, sobald er unter Navigation und Chip-Leiste liegt
const SENTINEL_MARGIN = "-120px 0px 0px 0px"
// Während eines Chip-Sprungs bleibt der angetippte Chip aktiv
const CLICK_LOCK_MS = 1000
const CHIP_INSET = 24

// Welt aus dem #hash; kaputte %-Folgen (z. B. „#%E0%A4%A“) ergeben null
// statt eines Fehlers, der sonst die ganze Seite abstürzen ließe
const worldKeyFromHash = (): string | null => {
  try {
    return decodeURIComponent(window.location.hash.slice(1)) || null
  } catch {
    return null
  }
}

const CHIP =
  "group inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-stone-300 bg-white px-3.5 text-[13px] text-stone-800 transition-colors hover:border-stone-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 aria-[current=location]:border-transparent aria-[current=location]:bg-[color:var(--chip-accent)] aria-[current=location]:text-white tablet:px-4 tablet:text-sm"

/**
 * Klebende Chip-Leiste der Farbwelten. Die Chips sind einfache Sprunglinks
 * (funktionieren ohne JS); JS ergänzt nur die aktive Welt samt Farbton.
 */
export default function WorldNav({ worlds, sentinelId }: WorldNavProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const lockRef = useRef<{ key: string; until: number } | null>(null)
  const [current, setCurrent] = useState<string | null>(null)
  const [introVisible, setIntroVisible] = useState(true)
  const active = introVisible ? null : current
  const activeWorld = worlds.find((w) => w.key === active)

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("section[data-world]")
    )
    // Zwischen zwei Welten (z. B. im Zwischenteil) bleibt die letzte aktiv
    const spy = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).pop()
        const key = hit?.target.getAttribute("data-world")
        if (!key) return
        const lock = lockRef.current
        if (lock && Date.now() < lock.until && lock.key !== key) return
        setCurrent(key)
      },
      { rootMargin: SPY_MARGIN }
    )
    sections.forEach((s) => spy.observe(s))

    const intro = document.getElementById(sentinelId)
    const sentinel = intro
      ? new IntersectionObserver(
          ([entry]) => setIntroVisible(entry.isIntersecting),
          { rootMargin: SENTINEL_MARGIN }
        )
      : null
    if (intro && sentinel) sentinel.observe(intro)
    else setIntroVisible(false)

    return () => {
      spy.disconnect()
      sentinel?.disconnect()
    }
  }, [sentinelId])

  // Sprunglink von einer anderen Seite (z. B. Farbwelt-Tür der Startseite):
  // Next scrollt nicht hin, weil die Welten erst nach dem Lade-Platzhalter
  // erscheinen. Ohne passenden #hash passiert nichts.
  const worldKeys = worlds.map((w) => w.key).join(",")
  useEffect(() => {
    const key = worldKeyFromHash()
    if (!key || !worldKeys.split(",").includes(key)) return
    document.getElementById(key)?.scrollIntoView({ block: "start" })
  }, [worldKeys])

  // Aktiven Chip in der Leiste sichtbar halten, ganz oben wieder an den
  // Anfang (nur die Leiste scrollt, nie die Seite – daher kein scrollIntoView)
  useEffect(() => {
    const list = listRef.current
    if (!list || list.scrollWidth <= list.clientWidth) return
    const chip = active
      ? list.querySelector<HTMLElement>(`[data-chip="${active}"]`)
      : null
    list.scrollTo({
      left: chip ? chip.offsetLeft - CHIP_INSET : 0,
      behavior: shouldReduceMotion() ? "auto" : "smooth",
    })
  }, [active])

  const onChipClick = (key: string) => {
    lockRef.current = { key, until: Date.now() + CLICK_LOCK_MS }
    setCurrent(key)
    setIntroVisible(false)
    trackEvent("select_content", { content_type: "farbwelt", content_id: key })
  }

  return (
    <nav
      aria-label="Farbwelten"
      className="sticky top-16 z-30 border-y border-stone-200 bg-stone-50 transition-colors duration-300 small:top-20"
      style={
        activeWorld ? { backgroundColor: activeWorld.chipTint } : undefined
      }
    >
      <ul
        ref={listRef}
        className="no-scrollbar relative flex h-[52px] items-center gap-2 overflow-x-auto overscroll-x-contain scroll-px-6 px-6 tablet:h-14 small:justify-center medium:px-8"
      >
        {worlds.map((world) => (
          <li key={world.key} className="shrink-0">
            <a
              href={`#${world.key}`}
              data-chip={world.key}
              aria-current={active === world.key ? "location" : undefined}
              onClick={() => onChipClick(world.key)}
              style={{ "--chip-accent": world.accent } as CSSProperties}
              className={CHIP}
            >
              {world.dots.length > 0 && (
                <span aria-hidden className="flex -space-x-1">
                  {world.dots.slice(0, 3).map((hex) => (
                    <span
                      key={hex}
                      className="h-2.5 w-2.5 rounded-full ring-1 ring-white"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </span>
              )}
              <span className="small:hidden">{world.shortName}</span>
              <span className="hidden small:inline">{world.name}</span>
              <span className="tabular-nums text-stone-500 group-aria-[current=location]:text-white/80">
                {world.count}
                <span className="sr-only"> Looks</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
