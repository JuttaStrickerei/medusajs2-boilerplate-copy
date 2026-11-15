"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { cn } from "@lib/utils"
import { imagesForColor } from "@lib/util/product-colors"
import { useProductColor } from "@modules/products/components/product-actions/product-color-context"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  thumbnail?: string | null
  title?: string
}

const slidesOf = (track: HTMLElement | null) =>
  Array.from(track?.children ?? []) as HTMLElement[]

// Galerie der Produktseite. Bei mehreren Farben zeigt sie nur die Bilder der
// gewählten Farbe; nach einem Farbwechsel beginnt sie wieder beim ersten Bild
// (key baut sie neu auf, damit stehen Auswahl und Slider wieder am Anfang).
const ImageGallery = ({
  images,
  thumbnail,
  title = "Produkt",
}: ImageGalleryProps) => {
  const { color, product } = useProductColor()
  const colorImages = useMemo(
    () => (product && color ? imagesForColor(product, color) : images),
    [product, color, images]
  )

  return (
    <Gallery
      key={color ?? "alle"}
      images={colorImages}
      thumbnail={thumbnail}
      title={title}
    />
  )
}

// Das große Bild ist ein Slider zum Wischen (natives Scrollen mit Einrasten).
// Unter 768px ragt das nächste Bild rechts ein Stück herein, wie bei den
// Looks; ab 768px füllt ein Bild den Rahmen. Pfeile, Lupe und Vorschaubilder
// bleiben und laufen mit dem Slider mit.
const Gallery = ({ images: rawImages, thumbnail, title }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)

  const images =
    rawImages && rawImages.length > 0
      ? rawImages
      : thumbnail
        ? [{ id: "thumbnail", url: thumbnail } as HttpTypes.StoreProductImage]
        : []
  const count = images.length

  // Wischen: das aktive Bild ergibt sich aus der Scrollposition
  useEffect(() => {
    const track = trackRef.current
    if (!track || count < 2) return

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const all = slidesOf(track)
        const step = all.length > 1 ? all[1].offsetLeft - all[0].offsetLeft : 0
        if (step <= 0) return
        const index = Math.round(track.scrollLeft / step)
        setSelectedIndex(Math.min(Math.max(index, 0), count - 1))
      })
    }

    track.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      track.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [count])

  // Aktives Vorschaubild in seiner Leiste sichtbar halten (nur waagrecht, die Seite bleibt stehen)
  useEffect(() => {
    const strip = thumbsRef.current
    const thumb = strip?.children[selectedIndex]
    if (!strip || !thumb) return
    const s = strip.getBoundingClientRect()
    const t = thumb.getBoundingClientRect()
    if (t.left < s.left) strip.scrollBy({ left: t.left - s.left })
    else if (t.right > s.right) strip.scrollBy({ left: t.right - s.right })
  }, [selectedIndex])

  // Pfeile und Vorschaubilder springen wie bisher ohne Gleiten zum Bild
  const goTo = (index: number) => {
    const track = trackRef.current
    const all = slidesOf(track)
    if (!track || !all[index]) return
    setSelectedIndex(index)
    track.scrollTo({ left: all[index].offsetLeft - all[0].offsetLeft })
  }

  // Lupe nur mit der Maus: Ein Fingertipp soll das Bild nicht vergrößern
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isZoomed) return
    const slide = slidesOf(trackRef.current)[selectedIndex] ?? e.currentTarget
    const rect = slide.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  if (!images || images.length === 0) {
    return (
      <div className="mx-auto aspect-[2/3] w-full max-w-[calc(80vh*2/3)] bg-stone-100 rounded-2xl flex items-center justify-center">
        <span className="text-stone-400">Kein Bild verfügbar</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image */}
      <div
        className={cn(
          // --slide = Breite eines Bilds: 2:3 wie die Packshots, nie höher als 80 % des Bildschirms.
          // Unter 768px 20px schmaler, damit das nächste Bild hereinragt.
          "group relative mx-auto w-full",
          count > 1
            ? "[--slide:min(calc(100%_-_1.25rem),calc(80vh_*_2_/_3))]"
            : "[--slide:min(100%,calc(80vh_*_2_/_3))]",
          "tablet:max-w-[calc(80vh*2/3)] tablet:[--slide:100%] tablet:rounded-2xl",
          "tablet:transition-shadow tablet:duration-300 tablet:hover:shadow-lg"
        )}
        onPointerEnter={(e) => e.pointerType === "mouse" && setIsZoomed(true)}
        onPointerLeave={() => setIsZoomed(false)}
        onPointerMove={handlePointerMove}
      >
        <div
          ref={trackRef}
          data-testid="gallery-track"
          className={cn(
            "flex gap-2 overflow-x-auto overscroll-x-contain snap-x snap-mandatory no-scrollbar",
            // Unter 768px bis an die Bildschirmränder (px-6 des content-container)
            "-mx-6 px-6 scroll-pl-6 tablet:mx-0 tablet:px-0 tablet:scroll-pl-0",
            // Platz hinter dem letzten Bild, damit auch es links einrasten kann
            "after:shrink-0 after:basis-[calc(100%_-_var(--slide)_-_0.5rem)] after:content-[''] tablet:after:hidden"
          )}
        >
          {images.map((image, index) => {
            const zoomed = isZoomed && index === selectedIndex
            return (
              <div
                key={image.id}
                data-testid="gallery-slide"
                className={cn(
                  // Fotos ganz zeigen (alte Kollektion 1:1, Details 4:5)
                  "relative aspect-[2/3] w-[var(--slide)] shrink-0 snap-start overflow-hidden rounded-2xl bg-stone-100 cursor-zoom-in",
                  count === 1 && "mx-auto"
                )}
              >
                {image.url && (
                  <Image
                    src={image.url}
                    alt={`${title} – Bild ${index + 1}`}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 767px) 85vw, 50vw"
                    className={cn(
                      "object-contain mix-blend-multiply transition-transform duration-300",
                      zoomed && "scale-150"
                    )}
                    style={
                      zoomed
                        ? {
                            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                          }
                        : undefined
                    }
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Rahmen über dem aktiven Bild: trägt Pfeile und Zähler */}
        {count > 1 && (
          <div className="pointer-events-none absolute left-0 top-0 aspect-[2/3] w-[var(--slide)]">
            {/* Pfeile nur mit Maus; am Handy wird gewischt */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                goTo(selectedIndex === 0 ? count - 1 : selectedIndex - 1)
              }}
              className={cn(
                "pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 z-10",
                "w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md",
                "hidden items-center justify-center [@media(hover:hover)]:flex",
                "text-stone-600 hover:text-stone-800 hover:bg-white",
                "transition-all duration-200",
                "opacity-0 group-hover:opacity-100"
              )}
              aria-label="Vorheriges Bild"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                goTo(selectedIndex === count - 1 ? 0 : selectedIndex + 1)
              }}
              className={cn(
                "pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 z-10",
                "w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md",
                "hidden items-center justify-center [@media(hover:hover)]:flex",
                "text-stone-600 hover:text-stone-800 hover:bg-white",
                "transition-all duration-200",
                "opacity-0 group-hover:opacity-100"
              )}
              aria-label="Nächstes Bild"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Zähler: unter 1024px oben, weil die feste Kaufleiste den unteren Bildrand verdeckt */}
            <div
              data-testid="gallery-counter"
              className="absolute right-3 top-3 z-10 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium tabular-nums text-stone-600 small:top-auto small:bottom-3"
            >
              {selectedIndex + 1} / {count}
            </div>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div
          ref={thumbsRef}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goTo(index)}
              aria-current={selectedIndex === index}
              data-testid="gallery-thumb"
              className={cn(
                "relative flex-shrink-0 w-[72px] h-[88px] rounded-lg overflow-hidden bg-stone-100",
                "transition-all duration-200 border-2",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400",
                selectedIndex === index
                  ? "border-stone-800 opacity-100"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {image.url && (
                <Image
                  src={image.url}
                  alt={`${title} – Vorschau ${index + 1}`}
                  fill
                  sizes="72px"
                  className="object-contain mix-blend-multiply"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
