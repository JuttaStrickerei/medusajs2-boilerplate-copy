/**
 * Small helpers for metadata built from Medusa data at request time.
 */

const ELLIPSIS = "…"

/**
 * Joins the non-empty parts with ". " and trims the result to `max`
 * characters at a word boundary.
 */
export function buildMetaDescription(
  parts: Array<string | null | undefined>,
  max = 155
): string {
  const text = parts
    .map((p) => p?.replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean)
    .map((p) => (/[.!?]$/.test(p) ? p : `${p}.`))
    .join(" ")

  if (text.length <= max) {
    return text
  }

  const cut = text.slice(0, max - ELLIPSIS.length)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(
    /[,;:.\s]+$/,
    ""
  )}${ELLIPSIS}`
}

/**
 * Optional per-item overrides maintained in the Medusa admin under
 * `metadata.seo_title` / `metadata.seo_description`.
 */
export function seoOverride(
  metadata: Record<string, unknown> | null | undefined
): { title?: string; description?: string } {
  const title = metadata?.seo_title
  const description = metadata?.seo_description
  return {
    ...(typeof title === "string" && title.trim() ? { title: title.trim() } : {}),
    ...(typeof description === "string" && description.trim()
      ? { description: description.trim() }
      : {}),
  }
}
