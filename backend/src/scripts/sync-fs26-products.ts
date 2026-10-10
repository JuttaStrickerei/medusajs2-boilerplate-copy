/**
 * FS26-Produkte auf DEV an den Live-Shop angleichen
 *
 * Die Produkte der Kollektion „Frühjahr/Sommer 2026" stehen auf DEV noch im
 * Stand vom April: ohne Kollektion, ohne Fotos, ohne Material. Die Saison
 * eines Looks ergibt sich aus der Kollektion seiner Teile (storefront
 * modules/looks/lib/seasons.ts), und Look-Seiten zeigen die Produktfotos.
 * Dieses Skript holt beides aus src/scripts/data/fs26-products.json nach
 * (Stand Live-Shop). Standard ist ein PROBELAUF.
 *
 * Aufruf (im Ordner backend/):
 *   pnpm medusa exec ./src/scripts/sync-fs26-products.ts
 *
 *   APPLY=1   wirklich hochladen und schreiben
 *
 * - Kollektion: wird angelegt, wenn es den Handle noch nicht gibt (Titelbild
 *   wie live). Produkte ohne Kollektion kommen hinein; steht ein Produkt in
 *   einer anderen Kollektion, bleibt es dort (nur Warnung).
 * - Fotos: werden aus dem öffentlichen Live-Bucket geladen, mit shrinkImage()
 *   verkleinert und als <handle>_<n> in den DEV-Bucket geladen, das erste ist
 *   das Vorschaubild. Sie ersetzen die bisherigen Fotos des Produkts (deren
 *   URLs stehen in der Ausgabe). Passen die Dateinamen schon, passiert nichts.
 * - Material: wird nur gesetzt, wenn es auf DEV leer ist.
 * - Texte, Varianten, Größen und Preise bleiben unverändert.
 *
 * Wiederholbar: Ein zweiter Probelauf nach APPLY=1 meldet 0 Änderungen.
 * Sicherheit: dieselbe DEV-Prüfung wie der Look-Import
 * (lib/assert-dev-environment.ts). Der Live-Shop wird nur gelesen
 * (öffentliche Bild-URLs).
 */
import path from "path"
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createCollectionsWorkflow,
  updateProductsWorkflow,
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"
import { assertDevEnvironment } from "../lib/assert-dev-environment"
import { shrinkImage } from "../lib/shrink-image"
import data from "./data/fs26-products.json"

const LIVE_BUCKET_PREFIX = "https://bucket-prod-1f4b.up.railway.app/"
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
}

type Log = (line?: string) => void

type SyncProduct = { handle: string; material: string; images: string[] }

type DevProduct = {
  id: string
  handle: string
  material?: string | null
  thumbnail?: string | null
  collection_id?: string | null
  images?: { url: string; rank?: number | null }[] | null
}

type ProductUpdate = {
  collection_id?: string
  material?: string
  images?: { url: string }[]
  thumbnail?: string
}

type DevCollection = {
  id: string
  handle: string
  title: string
  metadata?: Record<string, unknown> | null
}

// Upload-URL ".../kleid-dot_1-01M4348SMFCPMGP9N8G16Y5DBF.webp" → "kleid-dot_1"
// (der File-Provider hängt eine ULID an den Dateinamen)
const uploadedStemOf = (url: string) =>
  path.basename(url, path.extname(url)).replace(/-[0-9A-Z]{26}$/, "")

const sameList = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, i) => value === b[i])

function parseApply(): boolean {
  const raw = (process.env.APPLY ?? "").trim()
  if (raw === "" || raw === "0") return false
  if (raw === "1") return true
  throw new Error(
    `APPLY="${raw}" ist unklar – APPLY=1 schreibt, ohne APPLY läuft ein Probelauf`
  )
}

function parseData(): {
  collection: { handle: string; title: string; image: string }
  products: SyncProduct[]
} {
  const { collection, products } = data
  const problems: string[] = []
  if (!collection?.handle || !collection.title) {
    problems.push("collection braucht handle und title")
  }
  const urls = [collection?.image, ...products.flatMap((p) => p.images)]
  for (const url of urls) {
    if (!url?.startsWith(LIVE_BUCKET_PREFIX)) {
      problems.push(`Bild-URL ist nicht aus dem Live-Bucket: ${url}`)
    } else if (!MIME_BY_EXT[path.extname(url).toLowerCase()]) {
      problems.push(`Bild-URL hat keine bekannte Endung: ${url}`)
    }
  }
  const handles = products.map((p) => p.handle)
  if (new Set(handles).size !== handles.length) {
    problems.push("Produkt-Handle doppelt")
  }
  if (problems.length) {
    throw new Error(`Daten fehlerhaft:\n  - ${problems.join("\n  - ")}`)
  }
  return { collection, products }
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(encodeURI(url))
  if (!response.ok) {
    throw new Error(`Download fehlgeschlagen (${response.status}): ${url}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

// Lädt ein Live-Bild in den DEV-Bucket und gibt die neue URL zurück
async function copyImage(
  container: ExecArgs["container"],
  url: string,
  name: string
): Promise<{ url: string; bytes: number }> {
  const ext = path.extname(url).toLowerCase()
  const image = await shrinkImage(await download(url), `${name}${ext}`, MIME_BY_EXT[ext])
  const { result } = await uploadFilesWorkflow(container).run({
    input: {
      files: [
        {
          filename: image.filename,
          mimeType: image.mimeType,
          content: image.buffer.toString("base64"),
          access: "public",
        },
      ],
    },
  })
  if (!result[0]?.url) throw new Error(`Upload von ${name} lieferte keine URL`)
  return { url: result[0].url, bytes: image.buffer.length }
}

async function ensureCollection(
  container: ExecArgs["container"],
  wanted: { handle: string; title: string; image: string },
  apply: boolean,
  out: Log
): Promise<{ id: string | null; changes: number }> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: rows } = await query.graph({
    entity: "product_collection",
    fields: ["id", "handle", "title", "metadata"],
    filters: { handle: wanted.handle },
  })
  const existing = (rows as unknown as DevCollection[])[0]

  out()
  out(`Kollektion "${wanted.title}" (${wanted.handle})`)
  if (existing) {
    out(`  → vorhanden [${existing.id}]`)
    if (existing.title !== wanted.title) {
      out(`  (Titel bleibt "${existing.title}" – live heißt sie "${wanted.title}")`)
    }
    return { id: existing.id, changes: 0 }
  }

  out("  → CREATE (mit Titelbild wie live)")
  if (!apply) return { id: null, changes: 1 }

  const cover = await copyImage(container, wanted.image, `${wanted.handle}_titelbild`)
  const { result } = await createCollectionsWorkflow(container).run({
    input: {
      collections: [
        { title: wanted.title, handle: wanted.handle, metadata: { image: cover.url } },
      ],
    },
  })
  out(`    angelegt: ${result[0].id}, Titelbild ${cover.url}`)
  return { id: result[0].id, changes: 1 }
}

export default async function syncFs26Products({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const out: Log = (line = "") => logger.info(line)
  const apply = parseApply()

  out()
  out("FS26-Produkte auf DEV angleichen")
  out("================================")
  assertDevEnvironment(out)
  out(
    `  Modus:     ${
      apply
        ? "APPLY – lädt Fotos hoch und schreibt in die Datenbank"
        : "PROBELAUF – nichts wird hochgeladen oder geschrieben"
    }`
  )
  out(`  Quelle:    ${data.source}`)

  const { collection, products } = parseData()
  const { id: collectionId, changes: collectionChanges } = await ensureCollection(
    container,
    collection,
    apply,
    out
  )

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: rows } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "material",
      "thumbnail",
      "collection_id",
      "images.url",
      "images.rank",
    ],
    filters: { handle: products.map((p) => p.handle) },
  })
  const devByHandle = new Map(
    (rows as unknown as DevProduct[]).map((p) => [p.handle, p])
  )

  const summary = { update: 0, skip: 0, failed: 0, warnings: 0, uploads: 0 }

  for (const wanted of products) {
    const dev = devByHandle.get(wanted.handle)
    out()
    out(`[${wanted.handle}]`)
    if (!dev) {
      summary.failed++
      out("  → FEHLER: gibt es auf DEV nicht")
      continue
    }

    try {
      const update: ProductUpdate = {}
      const fields: string[] = []
      const lines: string[] = []

      // Kollektion (im Probelauf gibt es sie evtl. noch nicht)
      if (!dev.collection_id) {
        if (collectionId) update.collection_id = collectionId
        fields.push("collection_id")
        lines.push(`  Kollektion: – → ${collection.handle}`)
      } else if (collectionId && dev.collection_id !== collectionId) {
        summary.warnings++
        lines.push(
          `  ! Warnung: steht in einer anderen Kollektion (${dev.collection_id}) – bleibt dort`
        )
      }

      // Material: nur leeres Feld füllen
      const devMaterial = dev.material?.trim() ?? ""
      if (!devMaterial && wanted.material) {
        update.material = wanted.material
        fields.push("material")
        lines.push(`  Material: – → ${wanted.material}`)
      } else if (devMaterial && wanted.material && devMaterial !== wanted.material) {
        lines.push(`  (Material bleibt "${devMaterial}" – live "${wanted.material}")`)
      }

      // Fotos
      const current = [...(dev.images ?? [])]
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map((image) => image.url)
      const names = wanted.images.map((_, i) => `${wanted.handle}_${i + 1}`)
      const imagesDone =
        sameList(current.map(uploadedStemOf), names) && dev.thumbnail === current[0]

      if (imagesDone) {
        lines.push(`  Fotos: ${current.length} (unverändert)`)
      } else {
        lines.push(
          `  Fotos: ${current.length} → ${wanted.images.length}${
            current.length ? " (ersetzt die bisherigen)" : ""
          }`
        )
        current.forEach((url) => lines.push(`    bisher: ${url}`))
        const uploaded: string[] = []
        for (const [i, url] of wanted.images.entries()) {
          if (apply) {
            const copy = await copyImage(container, url, names[i])
            uploaded.push(copy.url)
            lines.push(`    ${i + 1}. ${path.basename(url)} → ${copy.url}`)
          } else {
            lines.push(`    ${i + 1}. ${path.basename(url)} → (neu) ${names[i]}`)
          }
          summary.uploads++
        }
        if (apply) {
          update.images = uploaded.map((url) => ({ url }))
          update.thumbnail = uploaded[0]
        }
        fields.push("images", "thumbnail")
      }

      if (!fields.length) {
        summary.skip++
        out("  → SKIP (alles aktuell)")
      } else {
        summary.update++
        out(`  → UPDATE (${fields.join(", ")})  [${dev.id}]`)
        if (apply) {
          await updateProductsWorkflow(container).run({
            input: { products: [{ id: dev.id, ...update }] },
          })
          lines.push(`    gespeichert: ${dev.id}`)
        }
      }
      lines.forEach((line) => out(line))
    } catch (error) {
      summary.failed++
      out(`  → FEHLER: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const changes = collectionChanges + summary.update
  out()
  out(`Zusammenfassung (${apply ? "APPLY" : "PROBELAUF"})`)
  out(
    `  Produkte:   ${products.length} – ${summary.update} UPDATE, ${summary.skip} SKIP, ${summary.failed} Fehler`
  )
  out(`  Fotos:      ${summary.uploads} ${apply ? "hochgeladen" : "hochzuladen"}`)
  out(`  Warnungen:  ${summary.warnings}`)
  out(`  Änderungen: ${changes}`)
  if (!apply) {
    out()
    out(
      changes
        ? "Probelauf – nichts hochgeladen, nichts geschrieben. Zum Ausführen denselben Befehl mit APPLY=1 starten."
        : "Probelauf – alles ist schon auf dem Stand des Live-Shops."
    )
  }

  if (summary.failed) {
    throw new Error(`${summary.failed} Produkt(e) fehlgeschlagen – siehe oben`)
  }
}
