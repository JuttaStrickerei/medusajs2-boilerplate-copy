import path from "path"
import sharp from "sharp"

// Product photos come out of the camera/AI tools as 5–9 MB PNGs. WebP q85 at
// max 2000px keeps knit texture visually identical (checked at 100% crop) and
// is ~25x smaller, which cuts bucket storage, egress and Next image-optimizer
// load on Railway.
export const SHRINK_MAX_EDGE = 2000
export const SHRINK_WEBP_QUALITY = 85

// Keep libvips memory low on the small Railway backend instance.
sharp.cache(false)

export type ShrunkImage = {
  buffer: Buffer
  mimeType: string
  filename: string
  originalSize: number
  shrunk: boolean
}

/**
 * Resizes to fit SHRINK_MAX_EDGE, applies EXIF rotation and re-encodes as WebP.
 * GIFs (possibly animated), SVGs and non-images are returned unchanged, as is
 * anything that would not get smaller.
 */
export async function shrinkImage(
  input: Buffer,
  filename: string,
  mimeType: string
): Promise<ShrunkImage> {
  const unchanged: ShrunkImage = {
    buffer: input,
    mimeType,
    filename,
    originalSize: input.length,
    shrunk: false,
  }

  if (!/^image\/(png|jpe?g|webp|avif|tiff|heic|heif)$/i.test(mimeType)) {
    return unchanged
  }

  try {
    const output = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({
        width: SHRINK_MAX_EDGE,
        height: SHRINK_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: SHRINK_WEBP_QUALITY, effort: 4, smartSubsample: true })
      .toBuffer()

    if (output.length >= input.length) return unchanged

    return {
      buffer: output,
      mimeType: "image/webp",
      filename: `${path.parse(filename).name}.webp`,
      originalSize: input.length,
      shrunk: true,
    }
  } catch {
    // Unreadable image: upload as-is rather than failing the whole batch.
    return unchanged
  }
}
