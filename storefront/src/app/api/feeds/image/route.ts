import sharp from "sharp"

/**
 * JPEG copies of the product photos for the product feed: the bucket holds
 * WebP (backend shrink-image.ts), which the Meta catalog does not take.
 * Only images from the shop's own bucket are converted, so this is no open
 * image proxy. Meta and Google download each image once and then cache it.
 * ?channel=google adds the IPTC note "created with AI" to the file, for the
 * Merchant Center only. Shop pages and the Meta catalog get images without it.
 */

// Meta recommends at least 1024 px; smaller is also faster to convert
const MAX_EDGE = 1200
const JPEG_QUALITY = 85
const MAX_SOURCE_BYTES = 15 * 1024 * 1024
const FETCH_TIMEOUT_MS = 10_000
const CACHE_SECONDS = 60 * 60 * 24 * 7

// The value Google requires for AI-generated images: the product photos are
// redrawn by an image model from real photos. Merchant Center help 14572008
const AI_GENERATED_XMP = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/">
      <Iptc4xmpExt:DigitalSourceType>http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia</Iptc4xmpExt:DigitalSourceType>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`

const hostOf = (value?: string) =>
  value?.replace(/^https?:\/\//, "").split("/")[0] || undefined

const ALLOWED_HOSTS = new Set(
  [
    hostOf(process.env.NEXT_PUBLIC_MINIO_ENDPOINT),
    hostOf(process.env.MEDUSA_CLOUD_S3_HOSTNAME),
    // Product photos point at the prod bucket on every environment
    "bucket-prod-1f4b.up.railway.app",
  ].filter(Boolean)
)

function sourceUrl(request: Request): URL | null {
  try {
    const url = new URL(new URL(request.url).searchParams.get("src") ?? "")
    return url.protocol === "https:" && ALLOWED_HOSTS.has(url.hostname)
      ? url
      : null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const url = sourceUrl(request)
  if (!url) return new Response("Bildquelle nicht erlaubt", { status: 400 })

  try {
    const source = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    const isImage = source.headers.get("content-type")?.startsWith("image/")
    if (!source.ok || !isImage) {
      return new Response("Bild nicht gefunden", { status: 404 })
    }
    const input = Buffer.from(await source.arrayBuffer())
    if (input.length > MAX_SOURCE_BYTES) {
      return new Response("Bild zu groß", { status: 413 })
    }

    const image = sharp(input)
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    const forGoogle = new URL(request.url).searchParams.get("channel") === "google"
    const jpeg = await (forGoogle ? image.withXmp(AI_GENERATED_XMP) : image).toBuffer()

    return new Response(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        // Upload URLs carry a unique id, the image behind one never changes
        "Cache-Control": `public, max-age=${CACHE_SECONDS}, immutable`,
      },
    })
  } catch (error) {
    console.error(
      "[feed] image conversion failed:",
      url.pathname,
      error instanceof Error ? error.message : error
    )
    return new Response("Bild konnte nicht umgewandelt werden", { status: 502 })
  }
}
