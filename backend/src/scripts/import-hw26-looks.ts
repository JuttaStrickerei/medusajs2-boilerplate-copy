/**
 * HW26-Looks importieren (Shop the Look)
 *
 * Legt die Looks aus src/scripts/data/hw26-looks.json an oder gleicht sie
 * ab. Standard ist ein PROBELAUF: das Skript zeigt nur, was es tun würde,
 * lädt nichts hoch und schreibt nichts.
 *
 * Aufruf (im Ordner backend/):
 *   HW26_DIR="/Volumes/OWC Envoy Pro FX/Work/Jutta/Jutta_HW26/HW26_Onlineshop_FINAL" \
 *     pnpm medusa exec ./src/scripts/import-hw26-looks.ts
 *
 *   APPLY=1        wirklich hochladen und schreiben
 *   ONLY=O02,O18   nur diese Looks
 *
 * Wiederholbar: Ein zweiter Probelauf nach APPLY=1 meldet 0 Änderungen.
 * - Fotos: shrinkImage() + uploadFilesWorkflow wie /admin/bulk-images/upload,
 *   Dateiname look-<handle>_<n>.webp. Quelle (Datei, Größe, SHA-256) und URL
 *   stehen in look.metadata.hw26_photo_sources. Unveränderte Fotos werden
 *   nicht noch einmal hochgeladen.
 * - Hinweise je Foto: look.metadata.photo_notes = { "<Bild-URL>": "<Text>" }.
 * - Teile: product_ids wird nur mitgeschickt, wenn sich die Liste samt
 *   Reihenfolge ändert, weil updateLookWorkflow sonst alle Teile neu anlegt.
 * - Beschreibung und Status werden nur beim Anlegen gesetzt und danach nicht
 *   mehr angefasst, damit Text und Freischaltung aus dem Admin erhalten
 *   bleiben.
 * - Wird für einen Look kein einziges Produkt gefunden, wird er übersprungen
 *   (zählt als Fehler) statt leer angelegt.
 * - Übernehmen statt doppelt anlegen: Gibt es den Look schon unter
 *   "look-<handle>" (im Admin angelegt, z. B. Andreas' Import vom 2026-10-04),
 *   wird dieser Look ergänzt. Fotos mit gleichem Dateinamen werden aus dem
 *   bestehenden Upload übernommen, nicht neu hochgeladen. Titel, Handle und
 *   Rang bleiben, wie sie dort gepflegt sind – Abweichungen vom Manifest
 *   stehen nur in der Ausgabe. Geschrieben werden Foto-Reihenfolge,
 *   Hinweise und Quellangaben (und die Teile, falls sie abweichen).
 *
 * Sicherheit: Bricht ab, wenn der Datenbank-Host nicht auf der DEV-Liste
 * steht (oder EXPECT_DB_HOST nicht passt), wenn Datenbank-, Redis- oder
 * Bucket-Host nach Prod aussehen oder der Bucket-Host nicht "dev" enthält.
 * medusa exec startet die Module schon vor diesem Check, wie jeder
 * Backend-Start: Dabei setzt der MinIO-Provider die Lese-Policy des Buckets
 * und das Meili-Plugin schreibt seine Index-Einstellungen – auch im
 * Probelauf. Das Skript selbst schreibt erst nach dem Check.
 */
import { createHash } from "crypto"
import { existsSync, readFileSync, statSync } from "fs"
import path from "path"
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import { assertHandleIsFree } from "../api/admin/looks/helpers"
import { shrinkImage } from "../lib/shrink-image"
import { LOOK_MODULE } from "../modules/look"
import LookModuleService from "../modules/look/service"
import { createLookWorkflow } from "../workflows/create-look"
import {
  updateLookWorkflow,
  UpdateLookWorkflowInput,
} from "../workflows/update-look"
import manifestData from "./data/hw26-looks.json"

const PHOTO_SUBDIR = "_Look-Fotos_Kollektionsseite"
const CODE_RE = /^O\d{2}$/
// Wie handleSchema in api/admin/looks/validators.ts
const HANDLE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// "centerbeam" = Prod-Postgres-Proxy, "interchange" = Prod-Redis-Proxy
// (Stand jutta-railway-Skill; Proxys können sich ändern)
const PROD_MARKERS = ["prod", "centerbeam", "interchange"]
// Positiv-Liste: nur diese Datenbank-Hosts gelten als DEV. "crossover" ist
// der Dev-Postgres-Proxy (Stand jutta-railway-Skill). Ändert sich der Proxy,
// den neuen Host bewusst per EXPECT_DB_HOST=<host> freigeben.
const DEV_DB_HOSTS = ["crossover.proxy.rlwy.net", "localhost", "127.0.0.1"]
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
}

type LookStatus = "draft" | "published"

type ManifestPhoto = { file: string; note: string }

type ManifestLook = {
  code: string
  handle: string
  title: string
  rank: number
  status: LookStatus
  folder: string
  photos: ManifestPhoto[]
  products: string[]
}

// Ein Eintrag in look.metadata.hw26_photo_sources
type PhotoSource = { file: string; bytes: number; sha256: string; url: string }

type ExistingLookItem = {
  id: string
  rank?: number | null
  deleted_at?: string | Date | null
  product_link?:
    | { product_id?: string | null }
    | { product_id?: string | null }[]
    | null
}

type ExistingLook = {
  id: string
  handle: string
  title: string
  status: LookStatus
  rank?: number | null
  images?: string[] | null
  metadata?: Record<string, unknown> | null
  deleted_at?: string | Date | null
  items?: (ExistingLookItem | null)[] | null
}

type ProductRow = { id: string; handle: string; status: string }

type Log = (line?: string) => void

const size = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`

const sameList = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, i) => value === b[i])

// JSON mit sortierten Schlüsseln, damit jsonb-Reihenfolge keine Rolle spielt
const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`
  }
  return JSON.stringify(value) ?? "null"
}

// Nur Host (und Port) einer Verbindungs-URL – niemals Zugangsdaten
const hostOf = (raw: string | undefined): string | null => {
  if (!raw?.trim()) return null
  try {
    const url = new URL(raw)
    if (url.hostname) {
      return url.port ? `${url.hostname}:${url.port}` : url.hostname
    }
  } catch {
    // z. B. Passwort mit Sonderzeichen – unten von Hand zerlegen
  }
  const withoutScheme = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
  const afterAt = withoutScheme.slice(withoutScheme.lastIndexOf("@") + 1)
  const match = afterAt.match(/^([^/?#\s]+)/)
  return match ? match[1] : null
}

const bucketHostOf = (raw: string | undefined): string | null => {
  const host = (raw ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
  return host || null
}

function checkEnvironment(out: Log) {
  const dbHost = hostOf(process.env.DATABASE_URL)
  const redisSet = !!process.env.REDIS_URL?.trim()
  const redisHost = redisSet ? hostOf(process.env.REDIS_URL) : null
  const bucketHost = bucketHostOf(process.env.MINIO_ENDPOINT)

  out("Umgebung")
  out(`  Datenbank: ${dbHost ?? "(nicht lesbar)"}`)
  out(
    `  Redis:     ${
      redisSet ? redisHost ?? "(nicht lesbar)" : "– (nicht gesetzt, In-Memory)"
    }`
  )
  out(`  Bucket:    ${bucketHost ?? "– (MINIO_ENDPOINT nicht gesetzt)"}`)

  const problems: string[] = []

  if (!dbHost) {
    problems.push("DATABASE_URL fehlt oder ist nicht lesbar")
  } else {
    // hostOf liefert "host:port" – verglichen wird der Hostname ohne Port
    const dbHostname = dbHost.toLowerCase().replace(/:\d+$/, "")
    const expected = process.env.EXPECT_DB_HOST?.trim().toLowerCase()
    const allowed = expected ? [expected.replace(/:\d+$/, "")] : DEV_DB_HOSTS
    if (!allowed.includes(dbHostname)) {
      problems.push(
        `Datenbank-Host "${dbHost}" ist kein bekannter DEV-Host (${allowed.join(", ")}). ` +
          `Ist das sicher DEV, mit EXPECT_DB_HOST=${dbHost} bestätigen.`
      )
    }
  }
  if (redisSet && !redisHost) problems.push("REDIS_URL ist nicht lesbar")

  if (!bucketHost) {
    problems.push(
      "MINIO_ENDPOINT fehlt – die Fotos würden im lokalen static/-Ordner landen"
    )
  } else {
    if (!bucketHost.toLowerCase().includes("dev")) {
      problems.push(`Bucket-Host "${bucketHost}" enthält nicht "dev"`)
    }
    if (!process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
      problems.push(
        "MINIO_ACCESS_KEY oder MINIO_SECRET_KEY fehlt – dann nutzt Medusa den lokalen Datei-Provider"
      )
    }
  }

  const hosts: [string, string | null][] = [
    ["Datenbank", dbHost],
    ["Redis", redisHost],
    ["Bucket", bucketHost],
  ]
  for (const [label, host] of hosts) {
    const marker = host
      ? PROD_MARKERS.find((m) => host.toLowerCase().includes(m))
      : undefined
    if (marker) {
      problems.push(`${label}-Host "${host}" sieht nach PROD aus ("${marker}")`)
    }
  }

  if (problems.length) {
    throw new Error(
      `Abbruch – das ist nicht die DEV-Umgebung:\n  - ${problems.join("\n  - ")}`
    )
  }
}

function parseApply(): boolean {
  const raw = (process.env.APPLY ?? "").trim()
  if (raw === "" || raw === "0") return false
  if (raw === "1") return true
  throw new Error(
    `APPLY="${raw}" ist unklar – APPLY=1 schreibt, ohne APPLY läuft ein Probelauf`
  )
}

function parseManifest(raw: unknown): ManifestLook[] {
  if (!Array.isArray(raw)) {
    throw new Error("Manifest: erwartet eine Liste von Looks")
  }

  const problems: string[] = []
  const looks: ManifestLook[] = []

  raw.forEach((entry: unknown, i) => {
    const e = (entry && typeof entry === "object" ? entry : {}) as Record<
      string,
      unknown
    >
    const at = `Eintrag ${i + 1}${typeof e.code === "string" ? ` (${e.code})` : ""}`
    const text = (key: string) =>
      typeof e[key] === "string" ? (e[key] as string).trim() : ""

    const code = text("code")
    const handle = text("handle")
    const title = text("title")
    const folder = text("folder")
    const status = text("status")
    const rank = e.rank

    if (!CODE_RE.test(code)) problems.push(`${at}: code fehlt oder ist ungültig`)
    if (!HANDLE_RE.test(handle)) problems.push(`${at}: handle "${handle}" ist ungültig`)
    if (!title) problems.push(`${at}: title fehlt`)
    if (!folder || /[\\/]/.test(folder) || folder.startsWith(".")) {
      problems.push(`${at}: folder "${folder}" ist ungültig`)
    }
    if (status !== "draft" && status !== "published") {
      problems.push(`${at}: status muss "draft" oder "published" sein`)
    }
    if (typeof rank !== "number" || !Number.isInteger(rank)) {
      problems.push(`${at}: rank muss eine ganze Zahl sein`)
    }

    const photos: ManifestPhoto[] = []
    if (!Array.isArray(e.photos) || !e.photos.length) {
      problems.push(`${at}: photos fehlt oder ist leer`)
    } else {
      for (const photo of e.photos as unknown[]) {
        const p = (photo && typeof photo === "object" ? photo : {}) as Record<
          string,
          unknown
        >
        const file = typeof p.file === "string" ? p.file.trim() : ""
        const ext = path.extname(file).toLowerCase()
        if (!file || /[\\/]/.test(file) || !MIME_BY_EXT[ext]) {
          problems.push(`${at}: Foto "${file}" ist ungültig`)
          continue
        }
        if (typeof p.note !== "string") {
          problems.push(`${at}: Foto ${file} braucht note (Text, darf leer sein)`)
          continue
        }
        if (photos.some((other) => other.file === file)) {
          problems.push(`${at}: Foto ${file} ist doppelt`)
          continue
        }
        photos.push({ file, note: p.note.trim() })
      }
    }

    const products: string[] = []
    if (!Array.isArray(e.products) || !e.products.length) {
      problems.push(`${at}: products fehlt oder ist leer`)
    } else {
      for (const product of e.products as unknown[]) {
        const productHandle = typeof product === "string" ? product.trim() : ""
        if (!HANDLE_RE.test(productHandle)) {
          problems.push(`${at}: Produkt-Handle "${productHandle}" ist ungültig`)
        } else if (products.includes(productHandle)) {
          problems.push(`${at}: Produkt ${productHandle} ist doppelt`)
        } else {
          products.push(productHandle)
        }
      }
    }

    looks.push({
      code,
      handle,
      title,
      rank: rank as number,
      status: status as LookStatus,
      folder,
      photos,
      products,
    })
  })

  for (const key of ["code", "handle"] as const) {
    const seen = new Set<string>()
    for (const look of looks) {
      if (seen.has(look[key])) problems.push(`${key} "${look[key]}" ist doppelt`)
      seen.add(look[key])
    }
  }

  if (problems.length) {
    throw new Error(`Manifest ist fehlerhaft:\n  - ${problems.join("\n  - ")}`)
  }

  return looks
}

function selectLooks(manifest: ManifestLook[], only: string | undefined) {
  if (!only?.trim()) return manifest

  const codes = only
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
  const unknown = codes.filter((code) => !manifest.some((l) => l.code === code))
  if (unknown.length) {
    throw new Error(`ONLY enthält unbekannte Looks: ${unknown.join(", ")}`)
  }

  return manifest.filter((look) => codes.includes(look.code))
}

const photoPathOf = (dir: string, look: ManifestLook, photo: ManifestPhoto) =>
  path.join(dir, "Looks", look.folder, PHOTO_SUBDIR, photo.file)

const isPhotoSource = (value: unknown): value is PhotoSource => {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    typeof v.file === "string" &&
    typeof v.bytes === "number" &&
    typeof v.sha256 === "string" &&
    typeof v.url === "string" &&
    v.url.length > 0
  )
}

const storedSourcesOf = (look: ExistingLook | null): PhotoSource[] => {
  const raw = look?.metadata?.hw26_photo_sources
  return Array.isArray(raw) ? raw.filter(isPhotoSource) : []
}

const sourceKey = (source: { file: string; sha256: string }) =>
  `${source.file}|${source.sha256}`

const linkedProductId = (item: ExistingLookItem): string | null => {
  const link = Array.isArray(item.product_link)
    ? item.product_link[0]
    : item.product_link
  return link?.product_id ?? null
}

// Aktuelle Teile in Anzeige-Reihenfolge (rank), ohne gelöschte Teile
const currentProductIdsOf = (look: ExistingLook): string[] =>
  (look.items ?? [])
    .filter((item): item is ExistingLookItem => !!item && !item.deleted_at)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map(linkedProductId)
    .filter((id): id is string => !!id)

// Präfix, unter dem Looks im Admin angelegt wurden (Andreas' Import)
const ADOPT_HANDLE_PREFIX = "look-"

// "Looks/O02/DSC06502.jpg" → "DSC06502"
const stemOf = (file: string) => path.basename(file, path.extname(file))

// Upload-URL ".../DSC06424-01M4348SMFCPMGP9N8G16Y5DBF.webp" → "DSC06424"
// (der File-Provider hängt eine ULID an den Dateinamen)
const uploadedStemOf = (url: string) =>
  path.basename(url, path.extname(url)).replace(/-[0-9A-Z]{26}$/, "")

export default async function importHw26Looks({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const out: Log = (line = "") => logger.info(line)
  const apply = parseApply()

  out()
  out("HW26-Looks importieren")
  out("======================")
  checkEnvironment(out)
  out(
    `  Modus:     ${
      apply
        ? "APPLY – lädt Fotos hoch und schreibt in die Datenbank"
        : "PROBELAUF – nichts wird hochgeladen oder geschrieben"
    }`
  )

  const hw26Dir = process.env.HW26_DIR?.trim()
  if (!hw26Dir) {
    throw new Error(
      'HW26_DIR fehlt, z. B. HW26_DIR="/Volumes/OWC Envoy Pro FX/Work/Jutta/Jutta_HW26/HW26_Onlineshop_FINAL"'
    )
  }
  if (!existsSync(path.join(hw26Dir, "Looks"))) {
    throw new Error(
      `In HW26_DIR fehlt der Ordner "Looks" (${hw26Dir}) – ist die Platte angesteckt?`
    )
  }
  out(`  Quelle:    ${hw26Dir}`)

  const manifest = parseManifest(manifestData as unknown)
  const looks = selectLooks(manifest, process.env.ONLY)
  out(
    `  Looks:     ${looks.length} von ${manifest.length}${
      process.env.ONLY?.trim() ? ` (ONLY=${process.env.ONLY.trim()})` : ""
    }`
  )

  // Alle Fotos müssen da sein, bevor irgendetwas passiert
  const missing = looks.flatMap((look) =>
    look.photos
      .map((photo) => photoPathOf(hw26Dir, look, photo))
      .filter((file) => !existsSync(file) || !statSync(file).isFile())
  )
  if (missing.length) {
    throw new Error(`Fotos fehlen:\n  - ${missing.join("\n  - ")}`)
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // Produkte per Handle auflösen
  const productHandles = [...new Set(looks.flatMap((look) => look.products))]
  const { data: productData } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "status"],
    filters: { handle: productHandles },
  })
  const productsByHandle = new Map(
    (productData as unknown as ProductRow[]).map((p) => [p.handle, p])
  )
  const handleById = new Map(
    [...productsByHandle.values()].map((p) => [p.id, p.handle])
  )

  // Bestehende Looks. query.graph liefert nur nicht gelöschte Zeilen; der
  // Unique-Index auf handle gilt auch nur für deleted_at IS NULL, ein
  // gelöschter Look mit gleichem Handle blockiert das Anlegen also nicht.
  const lookHandles = looks.map((look) => look.handle)
  const adoptHandles = lookHandles.map((handle) => ADOPT_HANDLE_PREFIX + handle)
  const { data: lookData } = await query.graph({
    entity: "look",
    fields: [
      "id",
      "handle",
      "title",
      "status",
      "rank",
      "images",
      "metadata",
      "deleted_at",
      "items.id",
      "items.rank",
      "items.deleted_at",
      "items.product_link.product_id",
    ],
    filters: { handle: [...lookHandles, ...adoptHandles] },
  })
  const existingByHandle = new Map(
    (lookData as unknown as ExistingLook[])
      .filter((look) => !look.deleted_at)
      .map((look) => [look.handle, look])
  )

  const lookService: LookModuleService = container.resolve(LOOK_MODULE)
  const allWithDeleted = await lookService.listLooks(
    { handle: lookHandles },
    { withDeleted: true, select: ["id", "handle", "deleted_at"] }
  )
  const deletedCount = new Map<string, number>()
  for (const row of allWithDeleted) {
    if (row.deleted_at) {
      deletedCount.set(row.handle, (deletedCount.get(row.handle) ?? 0) + 1)
    }
  }

  const summary = {
    create: 0,
    update: 0,
    skip: 0,
    failed: 0,
    warnings: 0,
    uploads: 0,
    uploadOriginalBytes: 0,
    uploadBytes: 0,
    reused: 0,
  }

  for (const look of looks) {
    const lines: string[] = []
    const warnings: string[] = []
    const existing =
      existingByHandle.get(look.handle) ??
      existingByHandle.get(ADOPT_HANDLE_PREFIX + look.handle) ??
      null
    // im Admin angelegter Look, der ergänzt statt ersetzt wird
    const adopted = !!existing && existing.handle !== look.handle

    out()
    out(
      `[${look.code}] ${look.handle} – "${look.title}" (Rang ${look.rank}, ${look.status})`
    )

    try {
      // Teile
      const productIds: string[] = []
      const productLines: string[] = []
      for (const handle of look.products) {
        const product = productsByHandle.get(handle)
        if (!product) {
          warnings.push(`Produkt "${handle}" gibt es hier nicht – wird ausgelassen`)
          productLines.push(`${handle} = FEHLT`)
          continue
        }
        if (product.status !== "published") {
          warnings.push(
            `Produkt "${handle}" ist "${product.status}" – wird verknüpft, im Shop aber erst sichtbar, wenn es veröffentlicht ist`
          )
        }
        productIds.push(product.id)
        productLines.push(
          `${handle} = ${product.id}${
            product.status !== "published" ? ` (${product.status})` : ""
          }`
        )
      }
      if (!productIds.length) {
        // Lieber gar nicht anlegen als einen leeren, veröffentlichten Look
        throw new Error(
          `Kein einziges Teil gefunden (${look.products.join(", ")}) – Look wird übersprungen`
        )
      }

      if (!existing && deletedCount.get(look.handle)) {
        lines.push(
          `  (${deletedCount.get(look.handle)} gelöschte(r) Look(s) mit diesem Handle – zählen nicht)`
        )
      }
      // Fotos: unveränderte (gleiche Datei + gleicher Inhalt) wiederverwenden
      const reusable = new Map(
        storedSourcesOf(existing).map((s) => [sourceKey(s), s.url])
      )
      // Ohne Quellangaben (im Admin angelegt): Fotos mit gleichem Dateinamen
      // aus dem bestehenden Upload übernehmen statt sie doppelt hochzuladen
      const uploadedByStem = new Map(
        storedSourcesOf(existing).length
          ? []
          : (existing?.images ?? []).map((url) => [uploadedStemOf(url), url])
      )

      if (existing && !storedSourcesOf(existing).length) {
        const unmatched = look.photos.filter(
          (photo) => !uploadedByStem.has(stemOf(photo.file))
        )
        if (unmatched.length) {
          warnings.push(
            `Look existiert schon, aber ohne HW26-Quellangaben – ${unmatched.length} Foto(s) ohne passenden Upload werden neu hochgeladen`
          )
        } else {
          lines.push(
            "  (Fotos aus dem bestehenden Upload übernommen – Dateinamen passen)"
          )
        }
      }
      const sources: PhotoSource[] = []
      const photoLines: string[] = []
      let toUpload = 0

      for (const [i, photo] of look.photos.entries()) {
        const n = i + 1
        const buffer = readFileSync(photoPathOf(hw26Dir, look, photo))
        const sha256 = createHash("sha256").update(buffer).digest("hex")
        const storedUrl = reusable.get(sourceKey({ file: photo.file, sha256 }))
        const reuseUrl = storedUrl ?? uploadedByStem.get(stemOf(photo.file))

        if (reuseUrl) {
          summary.reused++
          sources.push({ file: photo.file, bytes: buffer.length, sha256, url: reuseUrl })
          photoLines.push(
            `    ${n}. ${photo.file}  ${size(buffer.length)}  ${
              storedUrl ? "unverändert" : `übernommen: ${path.basename(reuseUrl)}`
            }`
          )
        } else {
          toUpload++
          const ext = path.extname(photo.file).toLowerCase()
          const image = await shrinkImage(
            buffer,
            `look-${look.handle}_${n}${ext}`,
            MIME_BY_EXT[ext]
          )

          let url = `(neu) ${image.filename}`
          if (apply) {
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
            if (!result[0]?.url) {
              throw new Error(`Upload von ${photo.file} lieferte keine URL`)
            }
            url = result[0].url
          }
          summary.uploads++
          summary.uploadOriginalBytes += buffer.length
          summary.uploadBytes += image.buffer.length

          sources.push({ file: photo.file, bytes: buffer.length, sha256, url })
          photoLines.push(
            `    ${n}. ${photo.file}  ${size(buffer.length)} → ${size(image.buffer.length)}${
              image.shrunk ? " WebP" : " (unverändert, WebP wäre größer)"
            }  ${apply ? `hochgeladen: ${url}` : `neu: ${image.filename}`}`
          )
        }

        if (photo.note) photoLines.push(`       Hinweis: ${photo.note}`)
      }

      const images = sources.map((s) => s.url)
      const photoNotes: Record<string, string> = {}
      look.photos.forEach((photo, i) => {
        if (photo.note) photoNotes[sources[i].url] = photo.note
      })
      // Nur diese zwei Schlüssel gehören dem Import; der Look-Service
      // mischt metadata flach (mergeMetadata), andere Schlüssel bleiben.
      const managedMetadata = {
        hw26_photo_sources: sources,
        photo_notes: photoNotes,
      }

      let action: string
      const changeLines: string[] = []

      if (!existing) {
        action = "CREATE"
        if (apply) {
          await assertHandleIsFree(container, look.handle)
          const { result } = await createLookWorkflow(container).run({
            input: {
              title: look.title,
              handle: look.handle,
              description: null,
              images,
              status: look.status,
              rank: look.rank,
              metadata: managedMetadata,
              product_ids: productIds,
            },
          })
          changeLines.push(`    angelegt: ${result.id}`)
        }
        summary.create++
      } else {
        const update: Omit<UpdateLookWorkflowInput, "id"> = {}
        const fields: string[] = []

        if (adopted) {
          lines.push(
            `  (Handle bleibt "${existing.handle}" – Manifest sagt "${look.handle}")`
          )
        }
        if (existing.title !== look.title) {
          if (adopted) {
            lines.push(
              `  (Titel bleibt "${existing.title}" – Manifest sagt "${look.title}")`
            )
          } else {
            update.title = look.title
            fields.push("title")
            changeLines.push(`    title: "${existing.title}" → "${look.title}"`)
          }
        }
        // Status nur beim Anlegen setzen: Ein im Admin freigeschalteter Look
        // (z. B. TAVIA, sobald Preis und Material da sind) soll durch einen
        // späteren Lauf nicht wieder auf Entwurf zurückfallen.
        if (existing.status !== look.status) {
          lines.push(
            `  (Status bleibt "${existing.status}" – Manifest sagt "${look.status}", wird nur beim Anlegen gesetzt)`
          )
        }
        if ((existing.rank ?? 0) !== look.rank) {
          if (adopted) {
            lines.push(
              `  (Rang bleibt ${existing.rank ?? 0} – Manifest sagt ${look.rank})`
            )
          } else {
            update.rank = look.rank
            fields.push("rank")
            changeLines.push(`    rank: ${existing.rank ?? 0} → ${look.rank}`)
          }
        }

        const currentImages = existing.images ?? []
        if (!sameList(currentImages, images)) {
          update.images = images
          fields.push("images")
          changeLines.push(
            `    images: ${currentImages.length} → ${images.length} Bilder (URLs oder Reihenfolge geändert)`
          )
        }

        const currentMetadata = existing.metadata ?? {}
        const desiredMetadata = { ...currentMetadata, ...managedMetadata }
        if (stableStringify(currentMetadata) !== stableStringify(desiredMetadata)) {
          update.metadata = managedMetadata
          fields.push("metadata")
          const keys = Object.keys(managedMetadata).filter(
            (key) =>
              stableStringify(currentMetadata[key]) !==
              stableStringify(desiredMetadata[key])
          )
          changeLines.push(`    metadata: ${keys.join(", ")}`)
        }

        const currentProductIds = currentProductIdsOf(existing)
        if (!sameList(currentProductIds, productIds)) {
          update.product_ids = productIds
          fields.push("product_ids")
          const label = (ids: string[]) =>
            ids.map((id) => handleById.get(id) ?? id).join(", ") || "–"
          changeLines.push(
            `    Teile: ${label(currentProductIds)} → ${label(productIds)}`
          )
        }

        if (!fields.length) {
          action = "SKIP (alles aktuell)"
          summary.skip++
        } else {
          action = `UPDATE (${fields.join(", ")})${
            adopted ? ` – ergänzt ${existing.handle}` : ""
          }`
          if (apply) {
            await updateLookWorkflow(container).run({
              input: { id: existing.id, ...update },
            })
            changeLines.push(`    gespeichert: ${existing.id}`)
          }
          summary.update++
        }
      }

      out(`  → ${action}${existing ? `  [${existing.id}]` : ""}`)
      changeLines.forEach((line) => out(line))
      lines.forEach((line) => out(line))
      out(
        `  Fotos: ${look.photos.length} (${toUpload} ${
          apply ? "hochgeladen" : "hochzuladen"
        }, ${look.photos.length - toUpload} unverändert)`
      )
      photoLines.forEach((line) => out(line))
      out(`  Teile: ${productIds.length} von ${look.products.length}`)
      productLines.forEach((line) => out(`    ${line}`))
    } catch (error) {
      summary.failed++
      out(`  → FEHLER: ${error instanceof Error ? error.message : String(error)}`)
      lines.forEach((line) => out(line))
    }

    summary.warnings += warnings.length
    warnings.forEach((warning) => out(`  ! Warnung: ${warning}`))
  }

  const changes = summary.create + summary.update
  out()
  out(`Zusammenfassung (${apply ? "APPLY" : "PROBELAUF"})`)
  out(
    `  Looks:      ${looks.length} – ${summary.create} CREATE, ${summary.update} UPDATE, ${summary.skip} SKIP, ${summary.failed} Fehler`
  )
  out(
    `  Fotos:      ${summary.uploads} ${apply ? "hochgeladen" : "hochzuladen"} (${size(
      summary.uploadOriginalBytes
    )} → ${size(summary.uploadBytes)}), ${summary.reused} unverändert`
  )
  out(`  Warnungen:  ${summary.warnings}`)
  out(`  Änderungen: ${changes}`)
  if (!apply) {
    out()
    out(
      changes
        ? "Probelauf – nichts hochgeladen, nichts geschrieben. Zum Ausführen denselben Befehl mit APPLY=1 starten."
        : "Probelauf – alles ist schon auf dem Stand des Manifests."
    )
  }

  if (summary.failed) {
    throw new Error(`${summary.failed} Look(s) fehlgeschlagen – siehe oben`)
  }
}
