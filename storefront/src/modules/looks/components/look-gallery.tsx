"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn, shouldReduceMotion } from "@lib/utils"
import { ChevronRight, Info } from "@components/icons"
import ImageLightbox from "./image-lightbox"

type LookGalleryProps = {
  images: string[]
  title: string
  // Hinweis je Bild-URL (metadata.photo_notes), steht immer UNTER dem Foto
  notes: Record<string, string>
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max)

const slidesOf = (track: HTMLElement | null) =>
  Array.from(track?.children ?? []) as HTMLElement[]

// Abstand zwischen zwei Fotos (Breite + Lücke)
const stepOf = (track: HTMLElement | null) => {
  const all = slidesOf(track)
  return all.length > 1 ? all[1].offsetLeft - all[0].offsetLeft : 0
}

const altText = (title: string, index: number) =>
  index === 0 ? title : `${title} – Bild ${index + 1}`

// Look-Fotos als Slider: mobil ein Foto plus Anschnitt des nächsten (wischen),
// ab 768px Pfeile + Fortschrittslinie, ab 1280px zwei Fotos nebeneinander.
// Breiten kommen aus globals.css (.look-gallery*).
export default function LookGallery({
  images,
  title,
  notes,
}: LookGalleryProps) {
  const count = images.length
  const trackRef = useRef<HTMLUListElement>(null)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  // Pfeil, der den Fokus übernimmt, wenn der fokussierte am Ende deaktiviert wird
  const refocus = useRef<"prev" | "next" | null>(null)
  const interacted = useRef(false)
  const [active, setActive] = useState(0)
  const [perView, setPerView] = useState(1)
  const [announcement, setAnnouncement] = useState("")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const maxIndex = Math.max(0, count - perView)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)")
    const update = () => setPerView(mq.matches ? 2 : 1)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const goTo = useCallback((index: number) => {
    const track = trackRef.current
    const all = slidesOf(track)
    if (!track || !all.length) return
    const target = all[clamp(index, 0, all.length - 1)]
    // Nur horizontal scrollen – scrollIntoView würde auch die Seite bewegen
    track.scrollTo({
      left: target.offsetLeft - all[0].offsetLeft,
      behavior: shouldReduceMotion() ? "auto" : "smooth",
    })
  }, [])

  // Aktives Bild aus der Scrollposition; Ansage erst nach Nutzeraktion
  useEffect(() => {
    const track = trackRef.current
    if (!track || count < 2) return

    let frame = 0
    let settle: ReturnType<typeof setTimeout> | undefined

    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0
          const step = stepOf(track)
          if (step > 0) {
            const i = clamp(Math.round(track.scrollLeft / step), 0, maxIndex)
            // Ein deaktivierter Button verliert den Fokus (er fiele auf den
            // Body zurück) – dann übernimmt der Pfeil in Gegenrichtung
            const focused = document.activeElement
            if (i >= maxIndex && focused === nextRef.current) {
              refocus.current = "prev"
            } else if (i <= 0 && focused === prevRef.current) {
              refocus.current = "next"
            }
            setActive(i)
          }
        })
      }
      if (settle) clearTimeout(settle)
      settle = setTimeout(() => {
        if (!interacted.current) return
        const step = stepOf(track)
        if (step <= 0) return
        const i = clamp(Math.round(track.scrollLeft / step), 0, maxIndex)
        const visible = perView === 2 ? [i, i + 1] : [i]
        const note = visible.map((v) => notes[images[v]]).find(Boolean)
        const label =
          perView === 2 && i + 1 < count
            ? `Bild ${i + 1}–${i + 2} von ${count}`
            : `Bild ${i + 1} von ${count}`
        setAnnouncement(note ? `${label}: Hinweis: ${note}` : label)
      }, 150)
    }

    const markInteraction = () => {
      interacted.current = true
    }

    track.addEventListener("scroll", onScroll, { passive: true })
    track.addEventListener("pointerdown", markInteraction, { passive: true })
    track.addEventListener("touchstart", markInteraction, { passive: true })
    track.addEventListener("wheel", markInteraction, { passive: true })
    return () => {
      track.removeEventListener("scroll", onScroll)
      track.removeEventListener("pointerdown", markInteraction)
      track.removeEventListener("touchstart", markInteraction)
      track.removeEventListener("wheel", markInteraction)
      if (frame) cancelAnimationFrame(frame)
      if (settle) clearTimeout(settle)
    }
  }, [count, maxIndex, perView, images, notes])

  useEffect(() => {
    const target =
      refocus.current === "prev"
        ? prevRef.current
        : refocus.current === "next"
        ? nextRef.current
        : null
    refocus.current = null
    if (target && !target.disabled) target.focus({ preventScroll: true })
  }, [active])

  // Beim Wechsel auf zwei Fotos je Ansicht den Index begrenzen
  useEffect(() => {
    setActive((a) => clamp(a, 0, maxIndex))
  }, [maxIndex])

  const go = (index: number) => {
    interacted.current = true
    goTo(clamp(index, 0, maxIndex))
  }

  // Tab auf ein nur angeschnittenes Foto: ganz in den Slider holen. Der
  // Browser scrollt selbst nicht, solange ein Stück sichtbar ist – sonst
  // spränge der Zähler beim Weitertabben von 1 auf 3.
  const revealOnFocus = (
    index: number,
    e: React.FocusEvent<HTMLButtonElement>
  ) => {
    const track = trackRef.current
    if (!track) return
    const t = track.getBoundingClientRect()
    const b = e.currentTarget.getBoundingClientRect()
    if (b.left >= t.left - 1 && b.right <= t.right + 1) return
    go(index)
  }

  const onTrackKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.target !== e.currentTarget) return
    const map: Record<string, number> = {
      ArrowLeft: active - 1,
      ArrowRight: active + 1,
      Home: 0,
      End: maxIndex,
    }
    if (!(e.key in map)) return
    e.preventDefault()
    go(map[e.key])
  }

  const lightbox =
    lightboxIndex !== null ? (
      <ImageLightbox
        images={images}
        title={title}
        initialIndex={lightboxIndex}
        captions={notes}
        onClose={(last) => {
          const opened = lightboxIndex
          setLightboxIndex(null)
          if (typeof last !== "number" || count < 2 || last === opened) return
          // Zuletzt angesehenes Foto in den Slider holen, falls nicht sichtbar
          if (last < active || last > active + perView - 1) go(last)
          // Fokus auf dieses Foto statt auf das (jetzt verdeckte) Startfoto –
          // nach dem Zurücksetzen des Fokus durch die Lightbox
          requestAnimationFrame(() => {
            slidesOf(trackRef.current)
              [last]?.querySelector<HTMLElement>("[data-testid=look-photo]")
              ?.focus({ preventScroll: true })
          })
        }}
      />
    ) : null

  if (count === 0) return null

  // Ein einzelnes Foto (Produktbild als Ersatz): kein Karussell
  if (count === 1) {
    const note = notes[images[0]]
    return (
      <figure className="look-gallery px-6 tablet:px-0">
        <div className="look-gallery__slide">
          <button
            type="button"
            data-testid="look-photo"
            aria-label="Bild 1 vergrößern"
            onClick={() => setLightboxIndex(0)}
            className="relative block aspect-[2/3] w-full overflow-hidden rounded-xl bg-stone-100 cursor-zoom-in"
          >
            <Image
              src={images[0]}
              alt={altText(title, 0)}
              fill
              priority
              sizes="(max-width: 767px) 82vw, (max-width: 1279px) 50vw, 460px"
              className="object-cover"
            />
          </button>
          {note && <Caption note={note} />}
        </div>
        {lightbox}
      </figure>
    )
  }

  const counterLabel =
    perView === 2 && active + 1 < count
      ? `${active + 1}–${active + 2} / ${count}`
      : `${active + 1} / ${count}`

  return (
    <section
      className={cn(
        "look-gallery",
        // Literal, damit Tailwind die Regel in globals.css behält
        count === 2 && "look-gallery--n2"
      )}
      aria-roledescription="Karussell"
      aria-label={`Fotos: ${title}`}
    >
      <ul
        ref={trackRef}
        id="look-gallery-track"
        tabIndex={0}
        onKeyDown={onTrackKeyDown}
        className="relative flex items-start gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar overscroll-x-contain px-6 scroll-pl-6 tablet:px-0 tablet:scroll-pl-0 motion-safe:scroll-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-800"
      >
        {images.map((url, i) => {
          const note = notes[url]
          return (
            <li
              key={url}
              role="group"
              aria-roledescription="Folie"
              aria-label={`Bild ${i + 1} von ${count}`}
              className="look-gallery__slide shrink-0 snap-start"
            >
              <figure>
                <button
                  type="button"
                  data-testid="look-photo"
                  aria-label={`Bild ${i + 1} vergrößern`}
                  onClick={() => setLightboxIndex(i)}
                  onFocus={(e) => revealOnFocus(i, e)}
                  className="relative block aspect-[2/3] w-full overflow-hidden rounded-xl bg-stone-100 cursor-zoom-in"
                >
                  <Image
                    src={url}
                    alt={altText(title, i)}
                    fill
                    priority={i === 0}
                    loading={i === 1 ? "eager" : undefined}
                    sizes="(max-width: 767px) 82vw, (max-width: 1279px) 50vw, 460px"
                    className="object-cover"
                  />
                  <span
                    aria-hidden
                    data-testid="look-photo-counter"
                    className="tablet:hidden absolute bottom-2.5 right-2.5 inline-flex h-6 items-center rounded-full bg-white/85 px-2 text-[11px] font-medium tabular-nums text-stone-700"
                  >
                    {i + 1} / {count}
                  </span>
                </button>
                {note && <Caption note={note} />}
              </figure>
            </li>
          )
        })}
      </ul>

      <div className="look-gallery__controls mt-3 hidden h-10 items-center gap-3 tablet:flex">
        <div className="relative h-px flex-1 bg-stone-300">
          <div
            className="absolute -top-px h-[3px] bg-stone-800 duration-300 motion-safe:transition-[left]"
            style={{
              width: `${(perView / count) * 100}%`,
              left: `${(active / count) * 100}%`,
            }}
          />
        </div>
        <span
          data-testid="look-gallery-counter"
          className="text-xs tabular-nums text-stone-600"
        >
          {counterLabel}
        </span>
        <button
          ref={prevRef}
          type="button"
          data-testid="look-gallery-prev"
          aria-label="Vorheriges Bild"
          aria-controls="look-gallery-track"
          onClick={() => go(active - 1)}
          disabled={active <= 0}
          className="grid h-10 w-10 place-items-center rounded-full border border-stone-300 text-stone-800 transition-colors hover:border-stone-800 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight size={18} className="rotate-180" />
        </button>
        <button
          ref={nextRef}
          type="button"
          data-testid="look-gallery-next"
          aria-label="Nächstes Bild"
          aria-controls="look-gallery-track"
          onClick={() => go(active + 1)}
          disabled={active >= maxIndex}
          className="grid h-10 w-10 place-items-center rounded-full border border-stone-300 text-stone-800 transition-colors hover:border-stone-800 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {lightbox}
    </section>
  )
}

function Caption({ note }: { note: string }) {
  return (
    <figcaption className="flex gap-1.5 pt-2 text-xs leading-4 text-stone-600 tablet:text-[13px] tablet:leading-5">
      <Info size={14} aria-hidden className="mt-px shrink-0 text-stone-400" />
      {note}
    </figcaption>
  )
}
