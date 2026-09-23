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
  onClose: () => void
}

// Vollbild-Vorschau aller Produktbilder (Pfeile, Tastatur, Wischen, Thumbnails)
export default function ImageLightbox({
  images,
  title,
  initialIndex = 0,
  onClose,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [mounted, setMounted] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const count = images.length

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + count) % count),
    [count]
  )
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count])

  useEffect(() => {
    setMounted(true)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
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
  }, [onClose, prev, next])

  if (!mounted || count === 0) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={`Bilder: ${title}`}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm">
          {title} · {index + 1} / {count}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 hover:bg-white/10"
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
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-stone-800 hover:bg-white"
              aria-label="Vorheriges Bild"
            >
              <ChevronRight size={22} className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-stone-800 hover:bg-white"
              aria-label="Nächstes Bild"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

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
