import type { HttpTypes } from "@medusajs/types"

// Produktfotos, die KI-Darstellungen aus echten Fotos sind (HW26):
// metadata.ai_images = true (im Admin als Text "true" gespeichert)
export const hasAiImages = (product: HttpTypes.StoreProduct): boolean => {
  const value = product.metadata?.ai_images
  return value === true || value === "true"
}

export const AI_IMAGES_NOTE =
  "Die Produktbilder wurden mit KI auf Basis echter Fotos erstellt. Farbe und Details können leicht vom Original abweichen."
