"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@lib/utils"
import { ChevronRight, Close } from "@components/icons"

type ImageLightboxProps = {
  images: string[]
  title: string
  initialIndex?: number
  // Optional: Bildunterschrift je Bild-URL (z. B. Hinweise zu Look-Fotos)
  captions?: Record<string, string>
  // Bekommt das zuletzt gezeigte Bild, damit der Aufrufer dorthin springen kann
  onClose: (lastIndex?: number) => void
}

// Vollbild-Vorschau aller Produktbilder (Pfeile, Tastatur, Wischen, Thumbnails)
export default function ImageLightbox({
  images,
  title,
  initialIndex = 0,
  captions,
  onClose,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [mounted, setMounted] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const indexRef = useRef(index)
  indexRef.current = index
  const count = images.length

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + count) % count),
    [count]
  )
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count])
  const close = useCallback(() => onClose(indexRef.current), [onClose])

  useEffect(() => {
    setMounted(true)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
    }
  }, [close, prev, next])

  // Fokus: beim Öffnen auf „Schließen“, beim Schließen zurück zum Auslöser
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    return () => {
      trigger?.focus?.({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    if (mounted) closeRef.current?.focus()
  }, [mounted])

  // Tab bleibt im Dialog
  const trapFocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !dialogRef.current) return
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"
      )
    )
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (
      e.shiftKey &&
      (active === first || !dialogRef.current.contains(active))
    ) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (!mounted || count === 0) return null

  const caption = captions?.[images[index]]

  // Fast deckender, weichgezeichneter Hintergrund: sonst scheint der
  // Seitentext (z. B. der Foto-Hinweis) doppelt hinter der Bildunterschrift durch
  return createPortal(
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Bilder: ${title}`}
      onClick={close}
      onKeyDown={trapFocus}
    >
      {/* Buttons 44px groß (Tippziel); py-2 statt py-3 hält die Kopfzeile etwa
          so hoch wie vorher */}
      <div className="flex items-center justify-between px-4 py-2 text-white">
        <span className="text-sm">
          {title} · {index + 1} / {count}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          aria-label="Schließen"
        >
          <Close size={22} />
        </button>
      </div>

      <div
        className="relative flex-1"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return
          const dx = e.changedTouches[0].clientX - touchStartX.current
          if (Math.abs(dx) > 40) (dx > 0 ? prev : next)()
          touchStartX.current = null
        }}
      >
        <Image
          key={images[index]}
          src={images[index]}
          alt={`${title} – Bild ${index + 1}`}
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-stone-800 hover:bg-white"
              aria-label="Vorheriges Bild"
            >
              <ChevronRight size={22} className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-stone-800 hover:bg-white"
              aria-label="Nächstes Bild"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {caption && (
        <p
          className="mx-auto max-w-xl px-4 pb-2 pt-3 text-center text-sm text-white/80"
          onClick={(e) => e.stopPropagation()}
        >
          {caption}
        </p>
      )}

      {count > 1 && (
        <div
          className="flex justify-center gap-2 overflow-x-auto px-4 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "relative h-16 w-12 flex-shrink-0 overflow-hidden rounded border-2",
                i === index ? "border-white" : "border-transparent opacity-60"
              )}
              aria-label={`Bild ${i + 1} anzeigen`}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  )
}
