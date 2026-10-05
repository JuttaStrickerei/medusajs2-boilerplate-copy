"use client"

import { useState } from "react"
import Image from "next/image"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { CARD_SIZES } from "@modules/products/components/product-preview/card-styles"

/**
 * Bild einer Übersichts-Kachel (Kategorien, Kollektionen). alt="": der Name
 * steht darunter im selben Link. Fehlt das Bild oder lädt es nicht (404),
 * zeigt die Kachel denselben ruhigen Platzhalter statt eines kaputten Bildes.
 */
export default function TileImage({ src }: { src?: string }) {
  const [hasFailed, setHasFailed] = useState(false)

  if (!src || hasFailed) {
    return (
      <span className="absolute inset-0 flex items-center justify-center text-stone-300">
        <PlaceholderImage size={24} aria-hidden />
      </span>
    )
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={CARD_SIZES}
      className="object-cover"
      onError={() => setHasFailed(true)}
    />
  )
}
