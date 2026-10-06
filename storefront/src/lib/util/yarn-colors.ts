import { COLOR_GROUPS, getColorGroupKeys } from "./filter-groups"

/**
 * Garnfarben aus der Produktoption „Farbe“, aus den Studiofotos gemessen,
 * damit Farbpunkt, Farbkarte der Looks und Foto zusammenpassen.
 * Schlüssel klein geschrieben.
 */
const YARN_HEX: Record<string, string> = {
  lila: "#7C40A7",
  bordeaux: "#4B111A",
  magenta: "#95404C",
  altrosa: "#D2B3B4",
  marine: "#191A28",
  rot: "#A6131C",
  petrol: "#437694",
  königsblau: "#1D2D51",
  türkis: "#5597AF",
  gelb: "#DFBB69",
  senf: "#917942",
  sand: "#C4B598",
  dunkelgrün: "#34402F",
  braun: "#625B56",
  hellgrau: "#C5C0BC",
  grau: "#73757D",
  schwarz: "#0F0D11",
}

const GROUP_HEX = new Map(COLOR_GROUPS.map((group) => [group.value, group.hex]))

/** Ein Ton: gemessenes Garn, sonst die Farbe seiner Filtergruppe („Moosgrün“ → Grün) */
const shadeHex = (shade: string): string | undefined =>
  YARN_HEX[shade] ?? GROUP_HEX.get(getColorGroupKeys(shade)[0])

/** Eintrag einer Farbkarte, z. B. in der Look-Übersicht */
export const yarnSwatch = (name: string) => ({
  name,
  hex: shadeHex(name.toLowerCase()) ?? "#A8A29E",
})

/**
 * Hintergrund des Farbpunkts für einen Farbwert: eine Farbe, bei
 * „Grau/Schwarz“ halb und halb. undefined, wenn kein Ton bekannt ist.
 */
export const yarnDotBackground = (value: string): string | undefined => {
  const hexes = value
    .toLowerCase()
    .split(/[/,&+-]/)
    .map((shade) => shade.trim())
    .filter(Boolean)
    .map(shadeHex)
    .filter((hex): hex is string => !!hex)

  if (hexes.length === 0) return undefined
  if (hexes.length === 1) return hexes[0]
  return `linear-gradient(90deg, ${hexes[0]} 50%, ${hexes[1]} 50%)`
}
