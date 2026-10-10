import type { StoreLook } from "@lib/data/looks"

// Hinweise zu einzelnen Look-Fotos, z. B. zu Teilen, die es nicht im
// Onlineshop gibt: metadata.photo_notes = { "<Bild-URL>": "<Text>" }.
// Zuordnung über die URL, damit Umsortieren oder Entfernen von Bildern im
// Admin keinen Hinweis auf das falsche Foto verschiebt.
export const getPhotoNotes = (
  metadata: StoreLook["metadata"]
): Map<string, string> => {
  const notes = new Map<string, string>()
  const raw = metadata?.photo_notes

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return notes
  }

  for (const [url, note] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof note === "string" && note.trim()) {
      notes.set(url.trim(), note.trim())
    }
  }

  return notes
}
