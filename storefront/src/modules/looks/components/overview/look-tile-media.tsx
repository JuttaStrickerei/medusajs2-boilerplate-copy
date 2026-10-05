import Image from "next/image"

import { cn } from "@lib/utils"
import type { LookCover } from "@modules/looks/lib/overview"

export type ImageLoading = "priority" | "eager" | "lazy"

// Breiten laut Raster: Reihe (Handy/Tablet), 4 Spalten ab 1024, 5 ab 1440
const TILE_SIZES =
  "(min-width:1440px) 256px, (min-width:1280px) 286px, (min-width:1024px) 229px, (min-width:768px) 300px, 64vw"
const LEAD_SIZES =
  "(min-width:1440px) 536px, (min-width:1280px) 596px, (min-width:1024px) 478px, (min-width:768px) 300px, 64vw"

type LookTileMediaProps = {
  cover: LookCover
  alt: string
  isLead: boolean
  loading: ImageLoading
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
}: LookTileMediaProps) {
  const sizes = isLead ? LEAD_SIZES : TILE_SIZES

  return (
    <div
      className={cn(
        // Hintergrund = Studio-Hintergrund der Fotos: nichts blitzt beim Laden
        "relative aspect-[2/3] overflow-hidden rounded-[4px] bg-[#EFF2F5]",
        isLead && "small:aspect-auto small:min-h-[20rem] small:flex-1"
      )}
    >
      {cover.src && (
        <Image
          fill
          src={cover.src}
          alt={alt}
          sizes={sizes}
          priority={loading === "priority"}
          fetchPriority={loading === "priority" ? "high" : undefined}
          loading={loading === "eager" ? "eager" : undefined}
          className="object-cover"
          style={{
            objectPosition: cover.position,
            transform: cover.zoom ? `scale(${cover.zoom})` : undefined,
            transformOrigin: cover.origin,
          }}
        />
      )}
      {/* Zweites Foto beim Überfahren; unter 1280px display:none, daher lädt
          ein Handy es nie */}
      {cover.hoverSrc && (
        <div
          aria-hidden
          className="absolute inset-0 hidden opacity-0 transition-opacity duration-500 ease-out group-focus-visible:opacity-100 medium:block [@media(hover:hover)]:group-hover:opacity-100"
        >
          <Image
            fill
            src={cover.hoverSrc}
            alt=""
            loading="lazy"
            sizes={sizes}
            className="object-cover"
          />
        </div>
      )}
    </div>
  )
}
