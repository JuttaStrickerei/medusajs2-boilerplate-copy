import Image from "next/image"

import { cn } from "@lib/utils"
import type { LookCover } from "@modules/looks/lib/overview"

export type ImageLoading = "priority" | "eager" | "lazy"

// Breiten laut Raster: Reihe (Handy/Tablet), 4 Spalten ab 1024, 5 ab 1440
const TILE_SIZES =
  "(min-width:1440px) 256px, (min-width:1280px) 286px, (min-width:1024px) 229px, (min-width:768px) 300px, 64vw"
const LEAD_SIZES =
  "(min-width:1440px) 536px, (min-width:1280px) 596px, (min-width:1024px) 478px, (min-width:768px) 300px, 64vw"

// Breite des Hover-Fotos ab 1280px (Kachel 256–286px, Aufmacher 536–596px)
const HOVER_TILE_WIDTH = 300
const HOVER_LEAD_WIDTH = 600

type LookTileMediaProps = {
  cover: LookCover
  alt: string
  isLead: boolean
  loading: ImageLoading
  /** eigene Bildbreiten für ein anderes Raster (sonst die der Übersicht) */
  sizes?: string
  /**
   * Farbe, in die das Studiofoto hineinmultipliziert wird (der helle
   * Studiohintergrund nimmt sie an). Ohne Angabe bleibt das Foto unverändert.
   */
  tint?: string
}

/**
 * Bildfläche einer Look-Kachel. Eigene Komponente, damit spätere Ideen
 * (Fotos wischen, Farbvorschau) nur diesen Teil austauschen.
 */
export default function LookTileMedia({
  cover,
  alt,
  isLead,
  loading,
  sizes,
  tint,
}: LookTileMediaProps) {
  const imageSizes = sizes ?? (isLead ? LEAD_SIZES : TILE_SIZES)
  const tintStyle = tint ? { backgroundColor: tint } : undefined

  return (
    <div
      className={cn(
        // Hintergrund = Studio-Hintergrund der Fotos: nichts blitzt beim Laden
        "relative aspect-[2/3] overflow-hidden rounded-[4px] bg-[#EFF2F5]",
        isLead && "small:aspect-auto small:min-h-[20rem] small:flex-1",
        // isolate: das Multiplizieren bleibt in der Bildfläche
        tint && "isolate"
      )}
      style={tintStyle}
    >
      {cover.src && (
        <Image
          fill
          src={cover.src}
          alt={alt}
          sizes={imageSizes}
          priority={loading === "priority"}
          fetchPriority={loading === "priority" ? "high" : undefined}
          loading={loading === "eager" ? "eager" : undefined}
          className={cn("object-cover", tint && "mix-blend-multiply")}
          style={{
            objectPosition: cover.position,
            transform: cover.zoom ? `scale(${cover.zoom})` : undefined,
            transformOrigin: cover.origin,
          }}
        />
      )}
      {/* Zweites Foto beim Überfahren; unter 1280px display:none, daher lädt
          ein Handy es nie. Es erscheint nur ab 1280px in fester Breite, daher
          feste Maße statt „sizes“: zwei statt acht srcset-Einträge im HTML.
          Mit Tönung bekommt es eine eigene deckende Fläche, sonst
          multiplizierte es sich mit dem Foto darunter und würde trüb. */}
      {cover.hoverSrc && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 hidden opacity-0 transition-opacity duration-500 ease-out group-focus-visible:opacity-100 medium:block [@media(hover:hover)]:group-hover:opacity-100",
            tint && "isolate"
          )}
          style={tintStyle}
        >
          <Image
            src={cover.hoverSrc}
            alt=""
            loading="lazy"
            width={isLead ? HOVER_LEAD_WIDTH : HOVER_TILE_WIDTH}
            height={(isLead ? HOVER_LEAD_WIDTH : HOVER_TILE_WIDTH) * 1.5}
            className={cn(
              "h-full w-full object-cover",
              tint && "mix-blend-multiply"
            )}
          />
        </div>
      )}
    </div>
  )
}
