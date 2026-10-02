import { BUCKET_RULES } from "./color-spectrum"

export const COLOR_OPTION_TITLES = ["color", "farbe", "colour"]
export const SIZE_OPTION_TITLES = ["size", "größe", "groesse"]

export interface ColorGroup {
  value: string
  label: string
  hex: string
}

/**
 * Filter colours, one per spectrum bucket from color-spectrum.ts, in the same
 * order as the "Farbe" sort. Shades like "Königsblau" or "Marine" are shown
 * as "Blau" instead of getting their own swatch.
 */
const COLOR_GROUPS_BY_BUCKET: Record<number, ColorGroup> = {
  0: { value: "rot", label: "Rot", hex: "#dc2626" },
  1: { value: "orange", label: "Orange", hex: "#ea580c" },
  2: { value: "braun", label: "Braun", hex: "#8b6f47" },
  3: { value: "beige", label: "Beige", hex: "#d4c4a8" },
  4: { value: "gelb", label: "Gelb", hex: "#eab308" },
  5: { value: "grün", label: "Grün", hex: "#16a34a" },
  6: { value: "blau", label: "Blau", hex: "#2563eb" },
  7: { value: "lila", label: "Lila", hex: "#a855f7" },
  8: { value: "rosa", label: "Rosa", hex: "#f472b6" },
  9: { value: "grau", label: "Grau", hex: "#6b7280" },
  10: { value: "weiß", label: "Weiß", hex: "#ffffff" },
  11: { value: "schwarz", label: "Schwarz", hex: "#1a1a1a" },
}

export const COLOR_GROUPS: ColorGroup[] = Object.keys(COLOR_GROUPS_BY_BUCKET)
  .map(Number)
  .sort((a, b) => a - b)
  .map((bucket) => COLOR_GROUPS_BY_BUCKET[bucket])

// Türkis and Petrol sit between blue and green (spectrum bucket: green), so
// they are listed under both filters.
const BLUE_GREEN_PATTERN = /(türkis|tuerkis|petrol|teal)/

/**
 * German colour compounds carry the base colour at the end ("Dunkelgrün",
 * "Steingrau", "Rotbraun"), so the rightmost match wins.
 */
function bucketForShade(shade: string): number | null {
  let best: { bucket: number; end: number } | null = null
  for (const rule of BUCKET_RULES) {
    const re = new RegExp(rule.pattern.source, "g")
    let match: RegExpExecArray | null
    while ((match = re.exec(shade))) {
      const end = match.index + match[0].length
      if (!best || end > best.end) best = { bucket: rule.bucket, end }
    }
  }
  return best?.bucket ?? null
}

/**
 * Maps a colour value ("Königsblau", "Grau/Schwarz") to its filter colours
 * ("blau"; "grau" + "schwarz"). Unknown shades keep their own lowercase name
 * so they still appear in the filter.
 */
export function getColorGroupKeys(raw: string): string[] {
  const keys = new Set<string>()
  const shades = raw
    .toLowerCase()
    .split(/[/,&+-]/)
    .map((s) => s.trim())
    .filter(Boolean)

  for (const shade of shades) {
    const bucket = bucketForShade(shade)
    const group = bucket !== null ? COLOR_GROUPS_BY_BUCKET[bucket] : undefined
    keys.add(group ? group.value : shade)
    if (BLUE_GREEN_PATTERN.test(shade)) {
      keys.add(COLOR_GROUPS_BY_BUCKET[5].value)
      keys.add(COLOR_GROUPS_BY_BUCKET[6].value)
    }
  }

  return Array.from(keys)
}

/**
 * Damen-Konfektionsgrößen (DE/AT) → Buchstabengröße, so a jacket in 36/42/46
 * shows up under S/M/L in the filter.
 */
const NUMERIC_SIZE_TO_LETTER: Record<string, string> = {
  "32": "xs",
  "34": "xs",
  "36": "s",
  "38": "s",
  "40": "m",
  "42": "m",
  "44": "l",
  "46": "l",
  "48": "xl",
  "50": "xl",
  "52": "xxl",
  "54": "xxl",
  "56": "xxxl",
  "58": "xxxl",
}

const SIZE_ALIASES: Record<string, string> = {
  "2xl": "xxl",
  "3xl": "xxxl",
}

/** Maps a size value ("42", "3XL", "M") to its filter size ("m", "xxxl", "m"). */
export function getSizeGroupKey(raw: string): string {
  const key = raw.trim().toLowerCase()
  return NUMERIC_SIZE_TO_LETTER[key] ?? SIZE_ALIASES[key] ?? key
}
