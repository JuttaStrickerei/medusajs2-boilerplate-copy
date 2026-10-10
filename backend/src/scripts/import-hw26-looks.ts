/**
 * Saison-Looks importieren (Shop the Look) – HW26, FS26
 *
 * Legt die Looks aus src/scripts/data/<saison>-looks.json an oder gleicht sie
 * ab. Standard ist ein PROBELAUF: das Skript zeigt nur, was es tun würde,
 * lädt nichts hoch und schreibt nichts.
 *
 * Aufruf (im Ordner backend/):
 *   HW26_DIR="/Volumes/OWC Envoy Pro FX/Work/Jutta/Jutta_HW26/HW26_Onlineshop_FINAL" \
 *     pnpm medusa exec ./src/scripts/import-hw26-looks.ts
 *
 *   SEASON=fs26 FS26_DIR="/Volumes/OWC Envoy Pro FX/Work/Jutta/Jutta_FS26/FS26_Onlineshop_FINAL" \
 *     pnpm medusa exec ./src/scripts/import-hw26-looks.ts
 *
 *   SEASON=fs26    Frühjahr/Sommer 2026 (ohne SEASON: hw26 wie bisher)
 *   APPLY=1        wirklich hochladen und schreiben
 *   ONLY=O02,O18   nur diese Looks
 *
 * Wiederholbar: Ein zweiter Probelauf nach APPLY=1 meldet 0 Änderungen.
 * - Fotos: shrinkImage() + uploadFilesWorkflow wie /admin/bulk-images/upload,
 *   Dateiname look-<handle>_<n>.webp. Quelle (Datei, Größe, SHA-256) und URL
 *   stehen in look.metadata.<saison>_photo_sources. Unveränderte Fotos werden
 *   nicht noch einmal hochgeladen. FS26 sucht die Fotos eines Looks in
 *   _Look-Fotos_Kollektionsseite und _Look-Fotos_Shooting.
 * - Hinweise je Foto: look.metadata.photo_notes = { "<Bild-URL>": "<Text>" }.
 * - Farbe je Teil (optional, Manifest "item_colors": { "<Handle>": "<Farbe>" }):
 *   look.metadata.item_colors. Die Farbe muss es am Produkt geben, sonst
 *   Warnung. Der Shop zeigt das Teil dann in dieser Farbe vorausgewählt.
 * - Teile nur im Geschäft (optional, Manifest "store_only_pieces":
 *   [{ title, color?, file, note? }], file relativ zum Look-Ordner):
 *   Bild wie die Fotos hochladen, look.metadata.store_only_pieces =
 *   [{ title, color?, image, note }], Quelle in <saison>_piece_sources.
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
import { assertDevEnvironment } from "../lib/assert-dev-environment"
import { shrinkImage } from "../lib/shrink-image"
import { LOOK_MODULE } from "../modules/look"
import LookModuleService from "../modules/look/service"
import { createLookWorkflow } from "../workflows/create-look"
import {
  updateLookWorkflow,
  UpdateLookWorkflowInput,
} from "../workflows/update-look"
import fs26ManifestData from "./data/fs26-looks.json"
import hw26ManifestData from "./data/hw26-looks.json"

type SeasonConfig = {
  label: string
  manifest: unknown
  dirEnv: string
  exampleDir: string
  codeRe: RegExp
  // Schlüssel in look.metadata für Quelle und URL der Fotos
  sourcesKey: string
  // dasselbe für die Bilder der Teile, die es nur im Geschäft gibt
  pieceSourcesKey: string
  // Unterordner eines Look-Ordners, in denen die Fotos liegen
  photoSubdirs: string[]
}

const SEASONS: Record<string, SeasonConfig> = {
  hw26: {
    label: "HW26",
    manifest: hw26ManifestData,
    dirEnv: "HW26_DIR",
    exampleDir:
      "/Volumes/OWC Envoy Pro FX/Work/Jutta/Jutta_HW26/HW26_Onlineshop_FINAL",
    codeRe: /^O\d{2}$/,
    sourcesKey: "hw26_photo_sources",
    pieceSourcesKey: "hw26_piece_sources",
    photoSubdirs: ["_Look-Fotos_Kollektionsseite"],
  },
  fs26: {
    label: "FS26",
    manifest: fs26ManifestData,
    dirEnv: "FS26_DIR",
    exampleDir:
      "/Volumes/OWC Envoy Pro FX/Work/Jutta/Jutta_FS26/FS26_Onlineshop_FINAL",
    codeRe: /^F\d{2}$/,
    sourcesKey: "fs26_photo_sources",
    pieceSourcesKey: "fs26_piece_sources",
    // Shooting = zweites Foto, wo die Kollektionsseite nur eines zeigt
    photoSubdirs: ["_Look-Fotos_Kollektionsseite", "_Look-Fotos_Shooting"],
  },
}

// Wie handleSchema in api/admin/looks/validators.ts
const HANDLE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
}

type LookStatus = "draft" | "published"

type ManifestPhoto = { file: string; note: string }

// Teil, das es nur im Geschäft gibt (z. B. Poncho SELVA): im Look nur
// Vorschaubild mit Hinweis. file liegt relativ zum Look-Ordner.
type ManifestStoreOnly = { title: string; color: string; file: string; note: string }

type ManifestLook = {
  code: string
  handle: string
  title: string
  rank: number
  status: LookStatus
  folder: string
  photos: ManifestPhoto[]
  products: string[]
  // Produkt-Handle → Farbe, in der das Teil im Look getragen wird
  item_colors?: Record<string, string>
  store_only_pieces?: ManifestStoreOnly[]
}

const STORE_ONLY_NOTE = "Nur im Geschäft erhältlich"

// Ein Eintrag in look.metadata.<saison>_photo_sources
type PhotoSource = { file: string; bytes: number; sha256: string; url: string }
// Ein Eintrag in look.metadata.<saison>_piece_sources
type PieceSource = { file: string; sha256: string; url: string }

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

type ProductRow = {
  id: string
  handle: string
  status: string
  options?: { title?: string | null; values?: { value: string }[] | null }[] | null
}

const COLOR_OPTION_TITLES = ["farbe", "farben", "color", "colour"]

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

function parseSeason(): SeasonConfig {
  const raw = (process.env.SEASON ?? "hw26").trim().toLowerCase()
  const season = SEASONS[raw]
  if (!season) {
    throw new Error(
      `SEASON="${raw}" ist unbekannt – erlaubt: ${Object.keys(SEASONS).join(", ")}`
    )
  }
  return season
}

function parseApply(): boolean {
  const raw = (process.env.APPLY ?? "").trim()
  if (raw === "" || raw === "0") return false
  if (raw === "1") return true
  throw new Error(
    `APPLY="${raw}" ist unklar – APPLY=1 schreibt, ohne APPLY läuft ein Probelauf`
  )
}

function parseManifest(raw: unknown, codeRe: RegExp): ManifestLook[] {
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

    if (!codeRe.test(code)) problems.push(`${at}: code fehlt oder ist ungültig`)
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

    let itemColors: Record<string, string> | undefined
    if (e.item_colors !== undefined) {
      if (!e.item_colors || typeof e.item_colors !== "object" || Array.isArray(e.item_colors)) {
        problems.push(`${at}: item_colors muss ein Objekt { Handle: Farbe } sein`)
      } else {
        itemColors = {}
        for (const [productHandle, color] of Object.entries(e.item_colors)) {
          if (!products.includes(productHandle)) {
            problems.push(`${at}: item_colors nennt ${productHandle}, das nicht in products steht`)
          } else if (typeof color !== "string" || !color.trim()) {
            problems.push(`${at}: item_colors.${productHandle} braucht eine Farbe`)
          } else {
            itemColors[productHandle] = color.trim()
          }
        }
      }
    }

    let storeOnly: ManifestStoreOnly[] | undefined
    if (e.store_only_pieces !== undefined) {
      if (!Array.isArray(e.store_only_pieces)) {
        problems.push(`${at}: store_only_pieces muss eine Liste sein`)
      } else {
        storeOnly = []
        for (const piece of e.store_only_pieces as unknown[]) {
          const q = (piece && typeof piece === "object" ? piece : {}) as Record<string, unknown>
          const pieceTitle = typeof q.title === "string" ? q.title.trim() : ""
          const file = typeof q.file === "string" ? q.file.trim() : ""
          const segments = file.split("/")
          if (!pieceTitle) problems.push(`${at}: store_only_pieces braucht title`)
          if (
            !file ||
            path.isAbsolute(file) ||
            segments.some((seg) => !seg || seg === "." || seg === "..") ||
            !MIME_BY_EXT[path.extname(file).toLowerCase()]
          ) {
            problems.push(`${at}: store_only_pieces-Bild "${file}" ist ungültig`)
            continue
          }
          storeOnly.push({
            title: pieceTitle,
            color: typeof q.color === "string" ? q.color.trim() : "",
            file,
            note: typeof q.note === "string" && q.note.trim() ? q.note.trim() : STORE_ONLY_NOTE,
          })
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
      ...(itemColors ? { item_colors: itemColors } : {}),
      ...(storeOnly ? { store_only_pieces: storeOnly } : {}),
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

// Pfad eines Look-Fotos: genau ein Unterordner der Saison muss es enthalten,
// sonst null (fehlt) bzw. Fehler (doppelt, wäre nicht eindeutig)
const photoPathOf = (
  dir: string,
  season: SeasonConfig,
  look: ManifestLook,
  photo: ManifestPhoto
): string | null => {
  const found = season.photoSubdirs
    .map((subdir) => path.join(dir, "Looks", look.folder, subdir, photo.file))
    .filter((file) => existsSync(file) && statSync(file).isFile())
  if (found.length > 1) {
    throw new Error(
      `Foto ${photo.file} liegt in mehreren Unterordnern von ${look.folder}: ${season.photoSubdirs.join(", ")}`
    )
  }
  return found[0] ?? null
}

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

const storedSourcesOf = (
  look: ExistingLook | null,
  sourcesKey: string
): PhotoSource[] => {
  const raw = look?.metadata?.[sourcesKey]
  return Array.isArray(raw) ? raw.filter(isPhotoSource) : []
}

const sourceKey = (source: { file: string; sha256: string }) =>
  `${source.file}|${source.sha256}`

// Bild eines Teils, das es nur im Geschäft gibt: relativ zum Look-Ordner
const piecePathOf = (dir: string, look: ManifestLook, piece: ManifestStoreOnly) =>
  path.join(dir, "Looks", look.folder, piece.file)

const storedPieceSourcesOf = (
  look: ExistingLook | null,
  key: string
): PieceSource[] => {
  const raw = look?.metadata?.[key]
  if (!Array.isArray(raw)) return []
  return raw.filter((value): value is PieceSource => {
    if (!value || typeof value !== "object") return false
    const v = value as Record<string, unknown>
    return (
      typeof v.file === "string" &&
      typeof v.sha256 === "string" &&
      typeof v.url === "string" &&
      v.url.length > 0
    )
  })
}

// Farbwerte eines Produkts (Option "Farbe"), z. B. ["Türkis", "Bordeaux"]
const colorValuesOf = (product: ProductRow): string[] => {
  const option = (product.options ?? []).find((o) =>
    COLOR_OPTION_TITLES.includes((o.title ?? "").trim().toLowerCase())
  )
  return (option?.values ?? []).map((v) => v.value)
}

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
  const season = parseSeason()

  out()
  out(`${season.label}-Looks importieren`)
  out("======================")
  assertDevEnvironment(out)
  out(
    `  Modus:     ${
      apply
        ? "APPLY – lädt Fotos hoch und schreibt in die Datenbank"
        : "PROBELAUF – nichts wird hochgeladen oder geschrieben"
    }`
  )

  const sourceDir = process.env[season.dirEnv]?.trim()
  if (!sourceDir) {
    throw new Error(
      `${season.dirEnv} fehlt, z. B. ${season.dirEnv}="${season.exampleDir}"`
    )
  }
  if (!existsSync(path.join(sourceDir, "Looks"))) {
    throw new Error(
      `In ${season.dirEnv} fehlt der Ordner "Looks" (${sourceDir}) – ist die Platte angesteckt?`
    )
  }
  out(`  Quelle:    ${sourceDir}`)

  const manifest = parseManifest(season.manifest, season.codeRe)
  const looks = selectLooks(manifest, process.env.ONLY)
  out(
    `  Looks:     ${looks.length} von ${manifest.length}${
      process.env.ONLY?.trim() ? ` (ONLY=${process.env.ONLY.trim()})` : ""
    }`
  )

  // Alle Fotos müssen da sein, bevor irgendetwas passiert
  const photoPaths = new Map<string, string>()
  const missing: string[] = []
  for (const look of looks) {
    for (const photo of look.photos) {
      const file = photoPathOf(sourceDir, season, look, photo)
      if (file) {
        photoPaths.set(`${look.code}/${photo.file}`, file)
      } else {
        missing.push(
          path.join(sourceDir, "Looks", look.folder, `{${season.photoSubdirs.join(",")}}`, photo.file)
        )
      }
    }
    for (const piece of look.store_only_pieces ?? []) {
      const file = piecePathOf(sourceDir, look, piece)
      if (!existsSync(file) || !statSync(file).isFile()) missing.push(file)
    }
  }
  if (missing.length) {
    throw new Error(`Fotos fehlen:\n  - ${missing.join("\n  - ")}`)
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // Produkte per Handle auflösen
  const productHandles = [...new Set(looks.flatMap((look) => look.products))]
  const { data: productData } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "status", "options.title", "options.values.value"],
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

  // Verkleinern (WebP ≤ 2000 px) und hochladen; im Probelauf nur den Namen
  const uploadImage = async (buffer: Buffer, filename: string, ext: string) => {
    const image = await shrinkImage(buffer, filename, MIME_BY_EXT[ext])
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
        throw new Error(`Upload von ${filename} lieferte keine URL`)
      }
      url = result[0].url
    }
    summary.uploads++
    summary.uploadOriginalBytes += buffer.length
    summary.uploadBytes += image.buffer.length
    return { url, image }
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
        storedSourcesOf(existing, season.sourcesKey).map((s) => [sourceKey(s), s.url])
      )
      // Ohne Quellangaben (im Admin angelegt): Fotos mit gleichem Dateinamen
      // aus dem bestehenden Upload übernehmen statt sie doppelt hochzuladen
      const uploadedByStem = new Map(
        storedSourcesOf(existing, season.sourcesKey).length
          ? []
          : (existing?.images ?? []).map((url) => [uploadedStemOf(url), url])
      )

      if (existing && !storedSourcesOf(existing, season.sourcesKey).length) {
        const unmatched = look.photos.filter(
          (photo) => !uploadedByStem.has(stemOf(photo.file))
        )
        if (unmatched.length) {
          warnings.push(
            `Look existiert schon, aber ohne ${season.label}-Quellangaben – ${unmatched.length} Foto(s) ohne passenden Upload werden neu hochgeladen`
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
      // Dateiname look-<handle>_<n>; FS26-Handles beginnen schon mit "look-"
      const uploadPrefix = look.handle.startsWith(ADOPT_HANDLE_PREFIX)
        ? look.handle
        : `${ADOPT_HANDLE_PREFIX}${look.handle}`

      for (const [i, photo] of look.photos.entries()) {
        const n = i + 1
        const buffer = readFileSync(photoPaths.get(`${look.code}/${photo.file}`)!)
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
          const { url, image } = await uploadImage(
            buffer,
            `${uploadPrefix}_${n}${ext}`,
            ext
          )

          sources.push({ file: photo.file, bytes: buffer.length, sha256, url })
          photoLines.push(
            `    ${n}. ${photo.file}  ${size(buffer.length)} → ${size(image.buffer.length)}${
              image.shrunk ? " WebP" : " (unverändert, WebP wäre größer)"
            }  ${apply ? `hochgeladen: ${url}` : `neu: ${image.filename}`}`
          )
        }

        if (photo.note) photoLines.push(`       Hinweis: ${photo.note}`)
      }

      // Farbe, in der ein Teil im Look getragen wird: muss es am Produkt geben
      let itemColors: Record<string, string> | undefined
      const colorLines: string[] = []
      if (look.item_colors) {
        itemColors = {}
        for (const [handle, color] of Object.entries(look.item_colors)) {
          const product = productsByHandle.get(handle)
          if (!product) continue // oben schon gewarnt
          const colors = colorValuesOf(product)
          if (!colors.includes(color)) {
            warnings.push(
              `item_colors: ${handle} hat keine Farbe "${color}" (vorhanden: ${colors.join(", ") || "–"}) – wird ausgelassen`
            )
            continue
          }
          itemColors[handle] = color
          colorLines.push(`    ${handle} = ${color}`)
        }
      }

      // Teile, die es nur im Geschäft gibt: Bild hochladen bzw. wiederverwenden
      const reusablePieces = new Map(
        storedPieceSourcesOf(existing, season.pieceSourcesKey).map((s) => [
          sourceKey(s),
          s.url,
        ])
      )
      const pieceSources: PieceSource[] = []
      const storeOnlyPieces: Record<string, string>[] = []
      const pieceLines: string[] = []
      for (const [i, piece] of (look.store_only_pieces ?? []).entries()) {
        const buffer = readFileSync(piecePathOf(sourceDir, look, piece))
        const sha256 = createHash("sha256").update(buffer).digest("hex")
        let url = reusablePieces.get(sourceKey({ file: piece.file, sha256 }))
        if (url) {
          summary.reused++
          pieceLines.push(`    ${piece.title}: ${path.basename(piece.file)} unverändert`)
        } else {
          const ext = path.extname(piece.file).toLowerCase()
          const uploaded = await uploadImage(
            buffer,
            `${uploadPrefix}_nur-im-geschaeft_${i + 1}${ext}`,
            ext
          )
          url = uploaded.url
          pieceLines.push(
            `    ${piece.title}: ${path.basename(piece.file)} ${size(buffer.length)} → ${size(
              uploaded.image.buffer.length
            )}  ${apply ? `hochgeladen: ${url}` : `neu: ${uploaded.image.filename}`}`
          )
        }
        pieceSources.push({ file: piece.file, sha256, url })
        storeOnlyPieces.push({
          title: piece.title,
          ...(piece.color ? { color: piece.color } : {}),
          image: url,
          note: piece.note,
        })
      }

      const images = sources.map((s) => s.url)
      const photoNotes: Record<string, string> = {}
      look.photos.forEach((photo, i) => {
        if (photo.note) photoNotes[sources[i].url] = photo.note
      })
      // Nur diese Schlüssel gehören dem Import (Farben und Nur-im-Geschäft-
      // Teile nur, wenn das Manifest sie nennt); der Look-Service mischt
      // metadata flach (mergeMetadata), andere Schlüssel bleiben.
      const managedMetadata: Record<string, unknown> = {
        [season.sourcesKey]: sources,
        photo_notes: photoNotes,
        ...(itemColors ? { item_colors: itemColors } : {}),
        ...(look.store_only_pieces
          ? {
              store_only_pieces: storeOnlyPieces,
              [season.pieceSourcesKey]: pieceSources,
            }
          : {}),
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
        // (z. B. erst, wenn Preis und Material da sind) soll durch einen
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
      if (colorLines.length) {
        out("  Farben im Look:")
        colorLines.forEach((line) => out(line))
      }
      if (pieceLines.length) {
        out("  Nur im Geschäft:")
        pieceLines.forEach((line) => out(line))
      }
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
