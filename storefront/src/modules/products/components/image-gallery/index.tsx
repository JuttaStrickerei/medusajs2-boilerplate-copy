"use client"

import { useState } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { cn } from "@lib/utils"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })

  const selectedImage = images[selectedIndex]

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-stone-100 rounded-2xl flex items-center justify-center">
        <span className="text-stone-400">Kein Bild verfügbar</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image */}
      <div
        className={cn(
          "group relative aspect-square bg-stone-100 rounded-2xl overflow-hidden",
          "cursor-zoom-in transition-shadow duration-300",
          "hover:shadow-lg"
        )}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        {selectedImage?.url && (
          <Image
            src={selectedImage.url}
            alt={`Produktbild ${selectedIndex + 1}`}
            fill
            priority={selectedIndex === 0}
            sizes="(max-width: 768px) 100vw, 50vw"
            className={cn(
              "object-cover transition-transform duration-300",
              isZoomed && "scale-150"
            )}
            style={
              isZoomed
                ? {
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }
                : undefined
            }
          />
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
              }}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 z-10",
                "w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md",
                "flex items-center justify-center",
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
                setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
              }}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 z-10",
                "w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md",
                "flex items-center justify-center",
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
          </>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 z-10 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-stone-600">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative flex-shrink-0 w-[72px] h-[88px] rounded-lg overflow-hidden",
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
                  alt={`Vorschau ${index + 1}`}
                  fill
                  sizes="72px"
                  className="object-cover"
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
