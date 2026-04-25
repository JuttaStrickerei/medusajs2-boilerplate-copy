import { HttpTypes } from "@medusajs/types"

const COLOR_OPTION_TITLES = ["color", "farbe", "colour"]

const BUCKET_NO_COLOR = 999
const BUCKET_UNKNOWN = 998

const BUCKET_RULES: Array<{ bucket: number; pattern: RegExp }> = [
  {
    bucket: 0,
    pattern:
      /(rot|red|bordeaux|weinrot|kirsch|cherry|crimson|burgund|burgundy|scarlet)/,
  },
  {
    bucket: 1,
    pattern:
      /(orange|koralle|coral|apricot|aprikose|terracotta|terrakotta|lachs|salmon)/,
  },
  {
    bucket: 2,
    pattern:
      /(braun|brown|kaffee|coffee|cognac|karamell|caramel|schoko|choco|kastanie|chestnut|rost|rust|mokka|mocca|mocha|haselnuss|hazelnut|nougat|umbra|umber|sepia)/,
  },
  {
    bucket: 3,
    pattern:
      /(beige|creme|cream|sand|taupe|ecru|ivory|elfenbein|champagner|champagne|kaschmir|cashmere|alpaka|alpaca|merino|natur|nude|tan|kamel|camel|leinen|linen|stein|stone)/,
  },
  {
    bucket: 4,
    pattern:
      /(gelb|yellow|senf|mustard|gold|golden|ocker|ochre|honig|honey|safran|saffron|zitron|lemon)/,
  },
  {
    bucket: 5,
    pattern:
      /(grün|gruen|green|oliv|olive|salbei|sage|mint|minze|tannen|forest|jade|khaki|smaragd|emerald|moos|moss|pistazie|pistachio|limette|lime|türkis|tuerkis|teal|petrol)/,
  },
  {
    bucket: 6,
    pattern:
      /(blau|blue|navy|marine|cobalt|kobalt|azur|azure|denim|jeans|royal|himmel|sky|indigo|aqua|cyan)/,
  },
  {
    bucket: 7,
    pattern:
      /(lila|lilac|purple|violet|flieder|mauve|aubergine|plum|pflaume|magenta|amethyst|orchid)/,
  },
  {
    bucket: 8,
    pattern: /(rosa|pink|rose|fuchsia|rosé|rosy|altrosa|puder|powder)/,
  },
  {
    bucket: 9,
    pattern:
      /(grau|grey|gray|silber|silver|anthrazit|anthracite|graphit|graphite|zink|zinc)/,
  },
  {
    bucket: 10,
    pattern: /(weiß|weiss|white|wollweiss|wollweiß|offwhite|snow)/,
  },
  { bucket: 11, pattern: /(schwarz|black|noir|jet|kohle|onyx|ebony)/ },
]

function bucketForColorName(name: string): number {
  const n = name.toLowerCase().trim()
  if (!n) return BUCKET_NO_COLOR
  for (const rule of BUCKET_RULES) {
    if (rule.pattern.test(n)) return rule.bucket
  }
  return BUCKET_UNKNOWN
}

function extractColorName(product: HttpTypes.StoreProduct): string {
  const colorOption = product.options?.find((o) =>
    COLOR_OPTION_TITLES.includes(o.title?.toLowerCase() || "")
  )
  const firstValue = colorOption?.values?.[0]?.value?.trim()
  if (firstValue) return firstValue

  const variantColor = product.variants
    ?.flatMap((v) => v.options || [])
    .find((opt) =>
      COLOR_OPTION_TITLES.includes(opt.option?.title?.toLowerCase() || "")
    )?.value
  return (variantColor || "").trim()
}

export interface SpectrumKey {
  bucket: number
  name: string
}

export function getProductSpectrumKey(
  product: HttpTypes.StoreProduct
): SpectrumKey {
  const name = extractColorName(product)
  return {
    bucket: bucketForColorName(name),
    name: name.toLowerCase(),
  }
}

export function compareBySpectrum(
  a: HttpTypes.StoreProduct,
  b: HttpTypes.StoreProduct
): number {
  const ka = getProductSpectrumKey(a)
  const kb = getProductSpectrumKey(b)
  if (ka.bucket !== kb.bucket) return ka.bucket - kb.bucket
  if (ka.name !== kb.name) return ka.name.localeCompare(kb.name, "de")
  const ta = a.title || ""
  const tb = b.title || ""
  return ta.localeCompare(tb, "de")
}
