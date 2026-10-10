import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  batchVariantImagesWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"

type LinkColorsBody = {
  // Product handles to process; empty = all products with a colour option
  handles?: string[]
}

type ProductReport = {
  handle: string
  colors: Record<string, number>
  colorsWithoutImages: string[]
  generalImages: number
  linksAdded: number
  linksRemoved: number
  thumbnailsSet: number
}

const COLOR_OPTION_TITLES = new Set(["farbe", "farben", "color", "colour"])

// Must match the rule documented in the Bulk Image Upload widget:
// lowercase, ä→ae ö→oe ü→ue ß→ss, everything else non-alphanumeric → "-".
function colorToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function imageBasename(url: string): string {
  const last = url.split("?")[0].split("/").pop() ?? ""
  try {
    return decodeURIComponent(last).toLowerCase()
  } catch {
    return last.toLowerCase()
  }
}

// "_<N>-<view>" right after the colour token decides the order; _1 comes first.
function imageNumber(basename: string, token: string): number {
  const m = basename.match(new RegExp(`_${token}_(\\d+)`))
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER
}

// Links product images to the variants of the colour named in the image
// filename (e.g. "O02_kleid-viola_lila_1-vorne.webp" → all "Lila" variants).
// Images are stored once on the product; variant images are only link rows.
export async function POST(
  req: AuthenticatedMedusaRequest<LinkColorsBody>,
  res: MedusaResponse
) {
  const handles = (req.body?.handles ?? []).filter(Boolean)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "images.id",
      "images.url",
      "images.rank",
      // Real link rows. variants.images can't be used: Medusa fills it with all
      // unlinked ("general") images as well.
      "images.variants.id",
      "options.id",
      "options.title",
      "variants.id",
      "variants.thumbnail",
      "variants.options.option_id",
      "variants.options.value",
    ],
    filters: handles.length ? { handle: handles } : {},
  })

  const reports: ProductReport[] = []
  const errors: string[] = []

  for (const product of products) {
    const colorOption = product.options?.find((o) =>
      COLOR_OPTION_TITLES.has((o?.title ?? "").trim().toLowerCase())
    )
    if (!colorOption) continue

    const images = (product.images ?? []).filter(Boolean) as {
      id: string
      url: string
      rank: number
      variants?: ({ id: string } | null)[] | null
    }[]
    const linkedByVariant = new Map<string, Set<string>>()
    for (const img of images) {
      for (const v of img.variants ?? []) {
        if (!v) continue
        if (!linkedByVariant.has(v.id)) linkedByVariant.set(v.id, new Set())
        linkedByVariant.get(v.id)!.add(img.id)
      }
    }
    const colorValues = Array.from(
      new Set<string>(
        (product.variants ?? []).flatMap((v) =>
          (v?.options ?? [])
            .filter((o) => o?.option_id === colorOption.id && o?.value)
            .map((o) => o!.value as string)
        )
      )
    )

    // colour value -> its images, ordered by the _N number in the filename
    const imagesByColor = new Map<string, typeof images>()
    const colorOfImage = new Map<string, string>()
    for (const value of colorValues) {
      const token = colorToken(value)
      if (!token) continue
      const matched = images
        .filter((img) => imageBasename(img.url).includes(`_${token}_`))
        .sort(
          (a, b) =>
            imageNumber(imageBasename(a.url), token) -
              imageNumber(imageBasename(b.url), token) || a.rank - b.rank
        )
      imagesByColor.set(value, matched)
      matched.forEach((img) => colorOfImage.set(img.id, value))
    }

    const report: ProductReport = {
      handle: product.handle,
      colors: Object.fromEntries(
        colorValues.map((v) => [v, imagesByColor.get(v)?.length ?? 0])
      ),
      colorsWithoutImages: colorValues.filter(
        (v) => !imagesByColor.get(v)?.length
      ),
      generalImages: images.filter((img) => !colorOfImage.has(img.id)).length,
      linksAdded: 0,
      linksRemoved: 0,
      thumbnailsSet: 0,
    }

    const thumbnailUpdates: { id: string; thumbnail: string }[] = []

    for (const variant of product.variants ?? []) {
      if (!variant) continue
      const color = variant.options?.find(
        (o) => o?.option_id === colorOption.id
      )?.value
      const wanted = color ? imagesByColor.get(color) ?? [] : []
      if (!wanted.length) continue

      const linked = linkedByVariant.get(variant.id) ?? new Set<string>()
      const add = wanted.map((img) => img.id).filter((id) => !linked.has(id))
      // Drop links to images that belong to another colour (e.g. after renaming)
      const remove = [...linked].filter(
        (id) => colorOfImage.has(id) && colorOfImage.get(id) !== color
      )

      try {
        if (add.length || remove.length) {
          await batchVariantImagesWorkflow(req.scope).run({
            input: { variant_id: variant.id, add, remove },
          })
          report.linksAdded += add.length
          report.linksRemoved += remove.length
        }
        if (!variant.thumbnail) {
          thumbnailUpdates.push({ id: variant.id, thumbnail: wanted[0].url })
        }
      } catch (err) {
        errors.push(`${product.handle} / ${color}: ${(err as Error).message}`)
      }
    }

    if (thumbnailUpdates.length) {
      try {
        await updateProductVariantsWorkflow(req.scope).run({
          input: { product_variants: thumbnailUpdates },
        })
        report.thumbnailsSet = thumbnailUpdates.length
      } catch (err) {
        errors.push(`${product.handle} thumbnails: ${(err as Error).message}`)
      }
    }

    reports.push(report)
  }

  res.status(200).json({ products: reports, errors })
}
