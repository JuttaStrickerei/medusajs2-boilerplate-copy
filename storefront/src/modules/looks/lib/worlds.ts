/**
 * Farbwelten der Looks-Übersicht: redaktionelle Gruppierung, Reihenfolge,
 * Farben und Bildwahl. Alles hier ist optional überschreibbar über
 * look.metadata (color_world, cover_index, cover_image, cover_position,
 * cover_zoom, tagline), sobald das Backend diese Schlüssel ausliefert.
 * Looks, die hier fehlen, ordnet die Übersicht automatisch über die Farbe
 * ihres ersten Teils zu. Die Saison steht nicht hier: Sie kommt aus der
 * Kollektion der Teile (siehe seasons.ts).
 */

import { yarnSwatch } from "@lib/util/yarn-colors"

// Querformat 1200×630 für Social Sharing; null = Standardbild der Seite
// (ein 2:3-Foto würde auf 1.91:1 schlecht beschnitten)
export const LOOKS_OG_IMAGE: string | null = null

export type WorldTheme = "light" | "dark"

export type WorldSwatch = { name: string; hex: string }

/** CSS-Variablen, die inline am Farbwelt-Abschnitt gesetzt werden */
export type WorldTokens = {
  "--welt-bg": string
  "--welt-ink": string
  "--welt-accent": string
  "--welt-end-bg": string
  "--welt-end-ink": string
  "--welt-text": string
  "--welt-muted": string
  "--welt-mat-ring": string
  "--welt-dot-ring": string
  "--welt-track": string
  "--welt-focus": string
}

export type LookWorld = {
  /** zugleich Sprungmarke (#key) */
  key: string
  name: string
  /** Chip-Beschriftung unter 1024px */
  shortName: string
  tagline: string
  /** „Farbkarte“: Namen aus der Produktoption Farbe */
  swatches: WorldSwatch[]
  /** Anzeige-Reihenfolge, der erste Look ist der große Aufmacher */
  handles: string[]
  /** Schlüssel des Farbfilters im Shop (/store?colors=…) */
  storeColors: string[]
  theme: WorldTheme
  tokens: WorldTokens
  /** Hintergrund der Chip-Leiste, solange diese Welt im Blick ist */
  chipTint: string
  /** Platz für ein späteres Stimmungsbild im Kopf der Welt (ab 1024px) */
  backdrop?: { src: string; position?: string }
}

type Palette = {
  bg: string
  ink: string
  accent: string
  endBg: string
  endInk: string
  matRing?: string
}

const lightTokens = (p: Palette): WorldTokens => ({
  "--welt-bg": p.bg,
  "--welt-ink": p.ink,
  "--welt-accent": p.accent,
  "--welt-end-bg": p.endBg,
  "--welt-end-ink": p.endInk,
  "--welt-text": "#44403C",
  "--welt-muted": "#57534E",
  "--welt-mat-ring": p.matRing ?? "rgba(0,0,0,.06)",
  "--welt-dot-ring": "rgba(0,0,0,.12)",
  "--welt-track": "rgba(0,0,0,.10)",
  "--welt-focus": p.ink,
})

const darkTokens = (p: Palette): WorldTokens => ({
  "--welt-bg": p.bg,
  "--welt-ink": p.ink,
  "--welt-accent": p.accent,
  "--welt-end-bg": p.endBg,
  "--welt-end-ink": p.endInk,
  "--welt-text": "#D6D3D1",
  "--welt-muted": "#A8A29E",
  "--welt-mat-ring": "transparent",
  "--welt-dot-ring": "rgba(255,255,255,.3)",
  "--welt-track": "rgba(255,255,255,.2)",
  "--welt-focus": "#F5F5F4",
})

export const LOOK_WORLDS: LookWorld[] = [
  {
    key: "beere-bordeaux",
    name: "Beere & Bordeaux",
    shortName: "Beere",
    tagline: "Lila, Bordeaux und Altrosa – Farbe, die wärmt.",
    swatches: [
      yarnSwatch("Lila"),
      yarnSwatch("Bordeaux"),
      yarnSwatch("Magenta"),
      yarnSwatch("Altrosa"),
    ],
    handles: [
      "look-viola",
      "look-rosana",
      "look-neva",
      "look-melva",
      "look-norva",
    ],
    storeColors: ["rot", "lila", "rosa"],
    theme: "light",
    tokens: lightTokens({
      bg: "#EEDDE1",
      ink: "#7A1F35",
      accent: "#7A1F35",
      endBg: "#7A1F35",
      endInk: "#FFFFFF",
    }),
    chipTint: "#EEDDE1",
  },
  {
    key: "marine-rot",
    name: "Marine & Rot",
    shortName: "Marine & Rot",
    tagline: "Marineblau trifft Rot – klassisch, mit Mut zur Farbe.",
    swatches: [
      yarnSwatch("Marine"),
      yarnSwatch("Rot"),
      yarnSwatch("Petrol"),
      yarnSwatch("Königsblau"),
    ],
    handles: [
      "look-talvo-nalea",
      "look-conte-aaron-tini",
      "look-rouga",
      "look-iris-hilda",
    ],
    storeColors: ["blau", "rot"],
    theme: "light",
    tokens: lightTokens({
      bg: "#DCE3EE",
      ink: "#A6131C",
      accent: "#A6131C",
      endBg: "#191A28",
      endInk: "#FFFFFF",
      // Blau trennt sich am wenigsten vom Studiohintergrund der Fotos
      matRing: "rgba(0,0,0,.10)",
    }),
    chipTint: "#DCE3EE",
  },
  {
    key: "moos-senf-erde",
    name: "Moos, Senf & Erde",
    shortName: "Moos & Senf",
    tagline: "Gelb, Senf und Erdtöne – natürlich und sonnig.",
    swatches: [
      yarnSwatch("Gelb"),
      yarnSwatch("Senf"),
      yarnSwatch("Dunkelgrün"),
      yarnSwatch("Braun"),
    ],
    handles: [
      "look-solara",
      "look-cora-mila",
      "look-selva-fenja",
      "look-glena-bruna",
      "look-senna",
    ],
    storeColors: ["gelb", "grün", "braun", "beige"],
    theme: "light",
    tokens: lightTokens({
      bg: "#E9E2CC",
      ink: "#6B5A26",
      accent: "#6B5A26",
      endBg: "#6B5A26",
      endInk: "#FFFFFF",
    }),
    chipTint: "#E9E2CC",
  },
  {
    key: "grau-graphit",
    name: "Grau & Graphit",
    shortName: "Grau",
    tagline: "Hellgrau, Grau und Schwarz – grafisch und zeitlos.",
    swatches: [
      yarnSwatch("Hellgrau"),
      yarnSwatch("Grau"),
      yarnSwatch("Schwarz"),
    ],
    handles: [
      "look-ray-dorli-floka",
      "look-grisol",
      "look-velara",
      "look-polly",
      "look-tesso",
      "look-vita",
    ],
    storeColors: ["grau", "schwarz"],
    theme: "dark",
    tokens: darkTokens({
      bg: "#2E2E33",
      ink: "#F5F5F4",
      accent: "#2E2E33",
      endBg: "#E0DDDA",
      endInk: "#2E2E33",
    }),
    chipTint: "#E0DDDA",
  },
]

/** Sammelband für Looks ohne Farbwelt (und neutraler Band bei wenigen Looks) */
export const FALLBACK_WORLD: LookWorld = {
  key: "weitere",
  name: "Weitere Looks",
  shortName: "Weitere",
  tagline: "Neue Kombinationen aus unserer Kollektion.",
  swatches: [],
  handles: [],
  storeColors: [],
  theme: "light",
  tokens: lightTokens({
    bg: "#F5F5F4",
    ink: "#1C1917",
    accent: "#1C1917",
    endBg: "#1C1917",
    endInk: "#FFFFFF",
  }),
  chipTint: "#F5F5F4",
}

/**
 * Automatische Zuordnung über die Filterfarbe des ersten Teils
 * (getColorGroupKeys), wenn ein Look weder in metadata noch oben steht.
 */
export const AUTO_WORLD_BY_COLOR: Record<string, string> = {
  rot: "beere-bordeaux",
  lila: "beere-bordeaux",
  rosa: "beere-bordeaux",
  blau: "marine-rot",
  gelb: "moos-senf-erde",
  grün: "moos-senf-erde",
  braun: "moos-senf-erde",
  beige: "moos-senf-erde",
  orange: "moos-senf-erde",
  grau: "grau-graphit",
  schwarz: "grau-graphit",
  weiß: "grau-graphit",
}

export type LookArt = {
  /** Index des Studiofotos, das die Kachel zeigt */
  coverIndex?: number
  /** Nur für Studiofotos: Zoom per CSS-Transform (kein Layout-Sprung) */
  zoom?: number
  origin?: string
  /** Stimmungszeile unter dem Namen des Aufmachers */
  mood?: string
  /** Testweise ein Titelbild vom Bucket, bevor metadata.cover_image geht */
  coverImage?: string
}

export const LOOK_ART: Record<string, LookArt> = {
  "look-viola": { mood: "Pullover, Rock und Schal in kräftigem Lila." },
  "look-neva": { zoom: 1.12, origin: "40% 45%" },
  "look-melva": { coverIndex: 2 },
  "look-talvo-nalea": { mood: "Petrol und Türkis – vier Teile, ein Look." },
  "look-iris-hilda": { zoom: 1.1, origin: "50% 45%" },
  "look-solara": {
    coverIndex: 1,
    mood: "Poncho, Pullover und Hose in sonnigem Gelb – Ton in Ton.",
  },
  "look-velara": { coverIndex: 1 },
  "look-ray-dorli-floka": {
    mood: "Hellgrau und Schwarz – Pullover, Rock und Jacke für kalte Tage.",
  },
  "look-tesso": { coverIndex: 1 },
}

/** Teile-Arten, wie sie am Anfang der Produkttitel stehen („Hose Fenja 5“) */
export const PIECE_TYPES = [
  "Pullover",
  "Top",
  "Tunika",
  "Rock",
  "Kleid",
  "Hose",
  "Jacke",
  "Mantel",
  "Blazer",
  "Weste",
  "Poncho",
  "Schal",
]
