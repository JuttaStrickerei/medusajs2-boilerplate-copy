/**
 * HW26-Produkte auf DEV auf den Stand von FINAL_v8 bringen
 *
 * Quelle: src/scripts/data/hw26-v8-products.json (aus Produktliste.csv und den
 * Ordnern von HW26_Onlineshop_FINAL_v8). Standard ist ein PROBELAUF.
 *
 * Aufruf (im Ordner backend/):
 *   HW26_DIR="/Volumes/OWC Envoy Pro FX/Work/Jutta/Jutta_HW26/HW26_Onlineshop_FINAL_v8" \
 *     pnpm medusa exec ./src/scripts/sync-hw26-v8-products.ts
 *
 *   APPLY=1                 wirklich hochladen und schreiben
 *   ONLY=schal-viola,…      nur diese Produkte
 *
 * Je Produkt, in dieser Reihenfolge:
 * - Neu (NERA, ZORA, PEONIA): als Entwurf anlegen, mit Farben, Größen XS–XXXL,
 *   Kategorie, Kollektion, Verkaufskanal und Versandprofil wie die übrigen
 *   HW26-Teile. Preise nur, wenn die Liste einen hat.
 * - Status: Rock NEVA (jetzt Rock NALEA Bordeaux) und Poncho SELVA (nur im
 *   Geschäft) gehen auf Entwurf.
 * - Schals: Größe wird „One Size“ mit genau einer Variante je Farbe. Die
 *   Variante in M bleibt (samt Preis) und wird umbenannt, die übrigen fallen weg.
 * - Neue Farben (Poncho SENNA Marine, Pullover Aaron Türkis, Rock NALEA
 *   Bordeaux): Farbwert ergänzen, Varianten in allen Größen des Produkts.
 * - Fotos: in der Reihenfolge der Dateinamen (1-vorne zuerst, bei Schals
 *   1-getragen) als WebP hochladen, je Farbe mit den Varianten verknüpfen,
 *   Vorschaubild je Variante und Produkt setzen. Dateiname wie beim
 *   Bulk-Upload (<Look>_<handle>_<farbe>_<n-ansicht>) plus Prüfsumme, damit ein
 *   zweiter Lauf erkennt, dass nichts zu tun ist.
 * - Preise: je Farbe der Preis aus den Daten (EUR-Basispreis aller Varianten
 *   dieser Farbe), z. B. Rock NALEA Bordeaux 85 € oder die neuen Teile.
 * Material und Gewicht stimmen laut Abgleich schon; Abweichungen stehen nur in
 * der Ausgabe.
 *
 * Sicherheit: dieselbe DEV-Prüfung wie der Look-Import
 * (lib/assert-dev-environment.ts).
 */
import { createHash } from "crypto"
import { existsSync, readFileSync } from "fs"
import path from "path"
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  batchVariantImagesWorkflow,
  createProductsWorkflow,
  createProductVariantsWorkflow,
  deleteProductVariantsWorkflow,
  updateProductOptionsWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"
import { assertDevEnvironment } from "../lib/assert-dev-environment"
import { shrinkImage } from "../lib/shrink-image"
import data from "./data/hw26-v8-products.json"

type Log = (line?: string) => void
type Status = "draft" | "published"

type Colour = {
  name: string
  code: string
  look: string
  price: number | null
  folder: string
  files: string[]
}

type Wanted = {
  handle: string
  title: string
  category?: string
  one_size?: boolean
  material?: string | null
  weight?: number | null
  status?: Status
  create?: boolean
  store_only?: boolean
  retired?: string
  colours: Colour[]
}

type DevOption = {
  id: string
  title: string
  values?: { id: string; value: string }[] | null
}
type DevVariant = {
  id: string
  title: string
  sku?: string | null
  thumbnail?: string | null
  options?: { option_id?: string | null; value: string }[] | null
  prices?: { amount?: number | string | null; currency_code?: string | null }[] | null
}
type DevImage = {
  id: string
  url: string
  rank?: number | null
  variants?: ({ id: string } | null)[] | null
}
type DevProduct = {
  id: string
  handle: string
  status: Status
  material?: string | null
  weight?: number | string | null
  thumbnail?: string | null
  options?: DevOption[] | null
  variants?: DevVariant[] | null
  images?: DevImage[] | null
}

type PlannedImage = {
  colour: string
  file: string
  buffer: Buffer
  name: string
}

const COLOUR_TITLES = ["farbe", "farben", "color", "colour"]
const SIZE_TITLES = ["größe", "groesse", "size"]
const KEEP_SIZE = "M"
const CURRENCY = "eur"
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
}

// Wie colorToken() in api/admin/bulk-images/link-colors: lowercase, Umlaute
// ausgeschrieben, alles andere zu "-"
const colourToken = (value: string) =>
  value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

// Upload-URL ".../O02_schal-viola_lila_1-getragen-ab12cd34-01M43…webp" →
// "O02_schal-viola_lila_1-getragen-ab12cd34"
const uploadedStemOf = (url: string) =>
  path
    .basename(decodeURIComponent(url.split("?")[0]), path.extname(url.split("?")[0]))
    .replace(/-[0-9A-Z]{26}$/, "")

// "Schal-VIOLA_Lila_1-getragen.jpg" → "1-getragen"
const viewOf = (file: string) =>
  path.basename(file, path.extname(file)).match(/_(\d-[a-z0-9-]+)$/i)?.[1] ??
  path.basename(file, path.extname(file))

const findOption = (options: DevOption[] | null | undefined, titles: string[]) =>
  (options ?? []).find((o) => titles.includes(o.title.trim().toLowerCase()))

// EUR-Preis einer Variante (HW26 hat nur einfache EUR-Preise ohne Regeln)
const basePriceOf = (variant: DevVariant): number | null => {
  const price = (variant.prices ?? []).find((p) => p.currency_code === CURRENCY)
  return price?.amount == null ? null : Number(price.amount)
}

const valueOf = (variant: DevVariant, optionId?: string) =>
  variant.options?.find((o) => o.option_id === optionId)?.value

function parseApply(): boolean {
  const raw = (process.env.APPLY ?? "").trim()
  if (raw === "" || raw === "0") return false
  if (raw === "1") return true
  throw new Error(
    `APPLY="${raw}" ist unklar – APPLY=1 schreibt, ohne APPLY läuft ein Probelauf`
  )
}

function selectProducts(all: Wanted[], only: string | undefined): Wanted[] {
  if (!only?.trim()) return all
  const handles = only.split(",").map((h) => h.trim()).filter(Boolean)
  const unknown = handles.filter((h) => !all.some((p) => p.handle === h))
  if (unknown.length) {
    throw new Error(`ONLY enthält unbekannte Produkte: ${unknown.join(", ")}`)
  }
  return all.filter((p) => handles.includes(p.handle))
}

// Fotos einer Farbe lesen und den Zielnamen samt Prüfsumme bilden
function planImages(dir: string, wanted: Wanted): PlannedImage[] {
  return wanted.colours.flatMap((colour) =>
    colour.files.map((file) => {
      const full = path.join(dir, colour.folder, file)
      if (!existsSync(full)) throw new Error(`Foto fehlt: ${full}`)
      const buffer = readFileSync(full)
      const sha = createHash("sha256").update(buffer).digest("hex").slice(0, 8)
      return {
        colour: colour.name,
        file,
        buffer,
        name: `${colour.look}_${wanted.handle}_${colourToken(colour.name)}_${viewOf(file)}-${sha}`,
      }
    })
  )
}

async function upload(
  container: ExecArgs["container"],
  image: PlannedImage
): Promise<string> {
  const ext = path.extname(image.file).toLowerCase()
  const shrunk = await shrinkImage(image.buffer, `${image.name}${ext}`, MIME_BY_EXT[ext])
  const { result } = await uploadFilesWorkflow(container).run({
    input: {
      files: [
        {
          filename: shrunk.filename,
          mimeType: shrunk.mimeType,
          content: shrunk.buffer.toString("base64"),
          access: "public",
        },
      ],
    },
  })
  if (!result[0]?.url) throw new Error(`Upload von ${image.file} lieferte keine URL`)
  return result[0].url
}

const PRODUCT_FIELDS = [
  "id",
  "handle",
  "status",
  "material",
  "weight",
  "thumbnail",
  "options.id",
  "options.title",
  "options.values.id",
  "options.values.value",
  "variants.id",
  "variants.title",
  "variants.sku",
  "variants.thumbnail",
  "variants.options.option_id",
  "variants.options.value",
  "variants.prices.amount",
  "variants.prices.currency_code",
  "images.id",
  "images.url",
  "images.rank",
  // echte Verknüpfungen (variants.images enthält auch alle unverknüpften)
  "images.variants.id",
]

export default async function syncHw26V8Products({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const out: Log = (line = "") => logger.info(line)
  const apply = parseApply()

  out()
  out("HW26-Produkte auf FINAL_v8 bringen")
  out("==================================")
  assertDevEnvironment(out)
  out(
    `  Modus:     ${
      apply
        ? "APPLY – lädt Fotos hoch und schreibt in die Datenbank"
        : "PROBELAUF – nichts wird hochgeladen oder geschrieben"
    }`
  )
  const dir = process.env.HW26_DIR?.trim()
  if (!dir || !existsSync(path.join(dir, "Looks"))) {
    throw new Error(
      'HW26_DIR fehlt oder hat keinen Ordner "Looks", z. B. HW26_DIR="/Volumes/OWC Envoy Pro FX/Work/Jutta/Jutta_HW26/HW26_Onlineshop_FINAL_v8"'
    )
  }
  out(`  Quelle:    ${dir}`)

  const products = selectProducts(data.products as Wanted[], process.env.ONLY)
  out(`  Produkte:  ${products.length} von ${data.products.length}`)

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const loadProduct = async (handle: string): Promise<DevProduct | null> => {
    const { data: rows } = await query.graph({
      entity: "product",
      fields: PRODUCT_FIELDS,
      filters: { handle },
    })
    return (rows as unknown as DevProduct[])[0] ?? null
  }

  // Gemeinsame Zuordnungen für neue Produkte: wie die übrigen HW26-Teile
  const { data: collections } = await query.graph({
    entity: "product_collection",
    fields: ["id"],
    filters: { handle: data.collection_handle },
  })
  const collectionId = (collections[0] as { id: string } | undefined)?.id
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  })
  const categoryId = new Map(
    (categories as { id: string; name: string }[]).map((c) => [c.name, c.id])
  )
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const channel = (channels as { id: string; name: string }[]).find(
    (c) => c.name === "Default Sales Channel"
  )
  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
  })
  const profile = (profiles as { id: string; name: string }[]).find(
    (p) => p.name === "Default Shipping Profile"
  )
  if (!collectionId || !channel || !profile) {
    throw new Error(
      "Kollektion, Default Sales Channel oder Default Shipping Profile fehlt auf DEV"
    )
  }

  const summary = { changed: 0, skip: 0, failed: 0, uploads: 0, warnings: 0 }

  for (const wanted of products) {
    out()
    out(`[${wanted.handle}] ${wanted.title}${wanted.retired ? ` – ${wanted.retired}` : ""}`)
    const lines: string[] = []
    const steps: string[] = []
    try {
      let dev = await loadProduct(wanted.handle)

      // 1. Neu anlegen
      if (!dev) {
        if (!wanted.create) throw new Error("gibt es auf DEV nicht und ist nicht als neu markiert")
        const sizes = data.sizes
        const catId = wanted.category ? categoryId.get(wanted.category) : undefined
        if (!catId) throw new Error(`Kategorie "${wanted.category}" fehlt auf DEV`)
        const prefix = `${wanted.title.slice(0, 3)}-${wanted.title.split(" ")[1].slice(0, 4)}`.toUpperCase()
        steps.push("CREATE (Entwurf)")
        lines.push(
          `  neu: ${wanted.colours.map((c) => c.name).join(", ")} × ${sizes.join("/")}, ${wanted.category}, ${
            wanted.colours.every((c) => c.price) ? "mit Preis" : "ohne Preis"
          }`
        )
        if (apply) {
          await createProductsWorkflow(container).run({
            input: {
              products: [
                {
                  title: wanted.title,
                  handle: wanted.handle,
                  status: "draft",
                  collection_id: collectionId,
                  category_ids: [catId],
                  material: wanted.material ?? undefined,
                  weight: wanted.weight ?? undefined,
                  sales_channels: [{ id: channel.id }],
                  shipping_profile_id: profile.id,
                  options: [
                    { title: "Farbe", values: wanted.colours.map((c) => c.name) },
                    { title: "Größe", values: sizes },
                  ],
                  variants: wanted.colours.flatMap((c) =>
                    sizes.map((size) => ({
                      title: `${c.name} / ${size}`,
                      sku: `${prefix}-${c.code}-${size}`,
                      options: { Farbe: c.name, Größe: size },
                      manage_inventory: false,
                      allow_backorder: true,
                      prices: c.price ? [{ amount: c.price, currency_code: CURRENCY }] : [],
                    }))
                  ),
                },
              ],
            },
          })
          dev = await loadProduct(wanted.handle)
        }
      }

      // 2. Status
      if (dev && wanted.status && dev.status !== wanted.status) {
        steps.push("status")
        lines.push(`  Status: ${dev.status} → ${wanted.status}`)
        if (apply) {
          await updateProductsWorkflow(container).run({
            input: { products: [{ id: dev.id, status: wanted.status }] },
          })
        }
      }

      // Abweichungen von Material/Gewicht nur melden
      const squash = (s?: string | number | null) => String(s ?? "").replace(/\s+/g, "").toLowerCase()
      if (dev && wanted.material && squash(dev.material) !== squash(wanted.material)) {
        summary.warnings++
        lines.push(`  ! Material auf DEV "${dev.material ?? "–"}", Liste "${wanted.material}" – nicht geändert`)
      }
      if (dev && wanted.weight && squash(dev.weight) !== squash(wanted.weight)) {
        summary.warnings++
        lines.push(`  ! Gewicht auf DEV ${dev.weight ?? "–"}, Liste ${wanted.weight} – nicht geändert`)
      }

      if (dev && !wanted.retired && !wanted.store_only) {
        const colourOption = findOption(dev.options, COLOUR_TITLES)
        const sizeOption = findOption(dev.options, SIZE_TITLES)
        if (!colourOption || !sizeOption) throw new Error("Farbe oder Größe fehlt als Option")
        const variants = dev.variants ?? []

        // 3. Schals: One Size
        const sizeValues = (sizeOption.values ?? []).map((v) => v.value)
        if (wanted.one_size && !(sizeValues.length === 1 && sizeValues[0] === data.one_size_value)) {
          const keep = new Map<string, DevVariant>()
          for (const colour of wanted.colours) {
            const ofColour = variants.filter((v) => valueOf(v, colourOption.id) === colour.name)
            // schon umbenannte Variante zuerst (Lauf abgebrochen), dann M
            const chosen =
              ofColour.find((v) => valueOf(v, sizeOption.id) === data.one_size_value) ??
              ofColour.find((v) => valueOf(v, sizeOption.id) === KEEP_SIZE) ??
              ofColour[0]
            if (!chosen) throw new Error(`keine Variante in ${colour.name}`)
            keep.set(colour.name, chosen)
          }
          const keptIds = new Set([...keep.values()].map((v) => v.id))
          const drop = variants.filter((v) => !keptIds.has(v.id))
          steps.push("one-size")
          lines.push(
            `  Größe: ${sizeValues.join("/")} → ${data.one_size_value} (${keep.size} Variante(n) bleiben, ${drop.length} fallen weg)`
          )
          if (apply) {
            await updateProductOptionsWorkflow(container).run({
              input: {
                selector: { id: sizeOption.id },
                update: { values: [...sizeValues, data.one_size_value] },
              },
            })
            await updateProductVariantsWorkflow(container).run({
              input: {
                product_variants: [...keep.entries()].map(([colour, v]) => ({
                  id: v.id,
                  title: `${colour} / ${data.one_size_value}`,
                  sku: v.sku ? v.sku.replace(/-[^-]+$/, "-OS") : undefined,
                  options: { [colourOption.title]: colour, [sizeOption.title]: data.one_size_value },
                })),
              },
            })
            if (drop.length) {
              await deleteProductVariantsWorkflow(container).run({
                input: { ids: drop.map((v) => v.id) },
              })
            }
            await updateProductOptionsWorkflow(container).run({
              input: { selector: { id: sizeOption.id }, update: { values: [data.one_size_value] } },
            })
          }
        }

        // 4. Neue Farben (nach der Umstellung oben mit frischem Stand)
        if (apply && steps.includes("one-size")) dev = (await loadProduct(wanted.handle))!
        const variantsNow = dev.variants ?? []
        const sizeValuesNow = (findOption(dev.options, SIZE_TITLES)?.values ?? []).map((v) => v.value)
        const devColours = new Set(
          variantsNow.map((v) => valueOf(v, colourOption.id)).filter(Boolean) as string[]
        )
        const newColours = wanted.colours.filter((c) => !devColours.has(c.name))
        if (newColours.length) {
          // Schals: nur One Size (im Probelauf stehen dort noch die alten Größen)
          const sizes = wanted.one_size
            ? [data.one_size_value]
            : data.sizes.filter((s) => sizeValuesNow.includes(s))
          const sample = variantsNow.find((v) => v.sku)?.sku ?? ""
          const prefix = sample.split("-").slice(0, 2).join("-")
          const fallbackPrice = wanted.colours.find((c) => devColours.has(c.name))?.price
          steps.push("neue Farben")
          for (const c of newColours) {
            const price = c.price ?? fallbackPrice
            lines.push(
              `  neue Farbe ${c.name}: ${sizes.length} Varianten (${sizes.join("/")}), Preis ${price ?? "–"} €`
            )
          }
          if (!prefix || !sizes.length) throw new Error("SKU-Muster oder Größen nicht ermittelbar")
          if (apply) {
            await updateProductOptionsWorkflow(container).run({
              input: {
                selector: { id: colourOption.id },
                update: {
                  values: [...(colourOption.values ?? []).map((v) => v.value), ...newColours.map((c) => c.name)],
                },
              },
            })
            await createProductVariantsWorkflow(container).run({
              input: {
                product_variants: newColours.flatMap((c) => {
                  const price = c.price ?? fallbackPrice
                  return sizes.map((size) => ({
                    product_id: dev!.id,
                    title: `${c.name} / ${size}`,
                    sku: `${prefix}-${c.code}-${size}`,
                    options: { [colourOption.title]: c.name, [sizeOption.title]: size },
                    manage_inventory: false,
                    allow_backorder: true,
                    prices: price ? [{ amount: price, currency_code: CURRENCY }] : [],
                  }))
                }),
              },
            })
          }
        }
      }

      // 5. Fotos
      if (!wanted.retired && !wanted.store_only) {
        const planned = planImages(dir, wanted)
        if (apply && dev) dev = await loadProduct(wanted.handle)
        const current = [...(dev?.images ?? [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        const same =
          !!dev &&
          current.length === planned.length &&
          current.every((img, i) => uploadedStemOf(img.url) === planned[i].name)
        const colourOption = findOption(dev?.options, COLOUR_TITLES)
        const thumbsOk =
          same &&
          dev!.thumbnail === current[0]?.url &&
          (dev!.variants ?? []).every((v) => {
            const first = planned.findIndex((p) => p.colour === valueOf(v, colourOption?.id))
            return first < 0 || v.thumbnail === current[first]?.url
          })

        if (same && thumbsOk) {
          lines.push(`  Fotos: ${planned.length} (unverändert)`)
        } else {
          steps.push("fotos")
          lines.push(`  Fotos: ${current.length} → ${planned.length}${current.length ? " (ersetzt die bisherigen)" : ""}`)
          planned.forEach((p, i) => lines.push(`    ${i + 1}. ${p.colour}: ${p.file}`))
          if (apply && dev) {
            // erst die alten Verknüpfungen lösen, dann Fotos ersetzen
            const linked = new Map<string, string[]>()
            for (const img of current) {
              for (const v of img.variants ?? []) {
                if (v) linked.set(v.id, [...(linked.get(v.id) ?? []), img.id])
              }
            }
            for (const [variantId, remove] of linked) {
              await batchVariantImagesWorkflow(container).run({
                input: { variant_id: variantId, add: [], remove },
              })
            }
            const urls: string[] = []
            for (const p of planned) {
              urls.push(await upload(container, p))
              summary.uploads++
            }
            await updateProductsWorkflow(container).run({
              input: {
                products: [{ id: dev.id, images: urls.map((url) => ({ url })), thumbnail: urls[0] }],
              },
            })
            const fresh = await loadProduct(wanted.handle)
            const idByUrl = new Map((fresh?.images ?? []).map((img) => [img.url, img.id]))
            const option = findOption(fresh?.options, COLOUR_TITLES)
            const thumbs: { id: string; thumbnail: string }[] = []
            for (const v of fresh?.variants ?? []) {
              const colour = valueOf(v, option?.id)
              const own = planned
                .map((p, i) => (p.colour === colour ? urls[i] : null))
                .filter((u): u is string => !!u)
              if (!own.length) continue
              await batchVariantImagesWorkflow(container).run({
                input: {
                  variant_id: v.id,
                  add: own.map((u) => idByUrl.get(u)).filter((id): id is string => !!id),
                  remove: [],
                },
              })
              thumbs.push({ id: v.id, thumbnail: own[0] })
            }
            if (thumbs.length) {
              await updateProductVariantsWorkflow(container).run({
                input: { product_variants: thumbs },
              })
            }
          } else {
            summary.uploads += planned.length
          }
        }
      }

      // 6. Preise je Farbe (neue Varianten aus Schritt 4 haben ihn schon)
      if (dev && !wanted.retired && !wanted.store_only) {
        const colourOption = findOption(dev.options, COLOUR_TITLES)
        const updates: { id: string; prices: { amount: number; currency_code: string }[] }[] = []
        for (const c of wanted.colours) {
          if (!c.price) continue
          const wrong = (dev.variants ?? []).filter(
            (v) => valueOf(v, colourOption?.id) === c.name && basePriceOf(v) !== c.price
          )
          if (!wrong.length) continue
          const before = [...new Set(wrong.map((v) => basePriceOf(v) ?? "–"))].join("/")
          lines.push(`  Preis ${c.name}: ${before} → ${c.price} € (${wrong.length} Variante(n))`)
          for (const v of wrong) {
            updates.push({ id: v.id, prices: [{ amount: c.price, currency_code: CURRENCY }] })
          }
        }
        if (updates.length) {
          steps.push("preise")
          if (apply) {
            await updateProductVariantsWorkflow(container).run({
              input: { product_variants: updates },
            })
          }
        }
      }

      if (steps.length) {
        summary.changed++
        out(`  → UPDATE (${steps.join(", ")})${dev ? `  [${dev.id}]` : ""}`)
      } else {
        summary.skip++
        out("  → SKIP (alles aktuell)")
      }
      lines.forEach((line) => out(line))
    } catch (error) {
      summary.failed++
      lines.forEach((line) => out(line))
      out(`  → FEHLER: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  out()
  out(`Zusammenfassung (${apply ? "APPLY" : "PROBELAUF"})`)
  out(
    `  Produkte:   ${products.length} – ${summary.changed} UPDATE, ${summary.skip} SKIP, ${summary.failed} Fehler`
  )
  out(`  Fotos:      ${summary.uploads} ${apply ? "hochgeladen" : "hochzuladen"}`)
  out(`  Warnungen:  ${summary.warnings}`)
  out(`  Änderungen: ${summary.changed}`)
  if (!apply) {
    out()
    out(
      summary.changed
        ? "Probelauf – nichts hochgeladen, nichts geschrieben. Zum Ausführen denselben Befehl mit APPLY=1 starten."
        : "Probelauf – alles ist schon auf dem Stand von FINAL_v8."
    )
  }
  if (summary.failed) {
    throw new Error(`${summary.failed} Produkt(e) fehlgeschlagen – siehe oben`)
  }
}
