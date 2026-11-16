// Nach „In den Warenkorb“ geht es direkt in den Warenkorb. Die Adresse sagt dem
// Warenkorb, was gerade dazukam (Bestätigungszeile) und wohin „Weiter einkaufen“
// zurückführt. Bewusst über die Adresse und nicht über einen Speicher im Browser:
// Es wird nichts auf dem Gerät abgelegt, und „Zurück“ funktioniert wie gewohnt.

/** Varianten, die gerade dazukamen, z. B. /cart?neu=variant_123,variant_456 */
export const ADDED_PARAM = "neu"
/** Seite, von der die Kundin kam, z. B. zurueck=/products/mantel-rouga?farbe=Marine */
export const BACK_PARAM = "zurueck"

// Nur eigene Produkt- und Look-Seiten, ohne Ländercode. Alles andere wird verworfen,
// damit der Link in der Bestätigungszeile nie aus dem Shop hinausführt.
const BACK_PATH = /^\/(products|looks)(\/[A-Za-z0-9_-]+){1,3}(\?[A-Za-z0-9=&%_.+~-]{0,200})?$/
const VARIANT_ID = /^[A-Za-z0-9_]{1,64}$/

export const isBackPath = (value?: string | null): value is string =>
  !!value && BACK_PATH.test(value)

/** Pfad des Warenkorbs (ohne Ländercode) nach dem Hinzufügen. */
export const cartPathAfterAdd = (variantIds: string[], backPath?: string) => {
  const params = new URLSearchParams()
  const ids = variantIds.filter((id) => VARIANT_ID.test(id)).slice(0, 12)
  if (ids.length) params.set(ADDED_PARAM, ids.join(","))
  if (isBackPath(backPath)) params.set(BACK_PARAM, backPath)
  const query = params.toString()
  return `/cart${query ? `?${query}` : ""}`
}

/** Aktuelle Seite ohne Ländercode, für „Weiter einkaufen“. Nur im Browser aufrufen. */
export const currentBackPath = (countryCode?: string | string[]) => {
  const prefix = `/${Array.isArray(countryCode) ? countryCode[0] : countryCode ?? ""}`
  const { pathname, search } = window.location
  const path =
    prefix.length > 1 && pathname.startsWith(`${prefix}/`)
      ? pathname.slice(prefix.length)
      : pathname
  const withSearch = `${path}${search}`
  return isBackPath(withSearch) ? withSearch : isBackPath(path) ? path : undefined
}

type SearchParams = Record<string, string | string[] | undefined>

const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value

/** Liest die beiden Angaben aus der Adresse des Warenkorbs. */
export const readAddedParams = (searchParams?: SearchParams) => {
  const variantIds = (first(searchParams?.[ADDED_PARAM]) ?? "")
    .split(",")
    .filter((id) => VARIANT_ID.test(id))
    .slice(0, 12)
  const back = first(searchParams?.[BACK_PARAM])
  return { variantIds, backPath: isBackPath(back) ? back : undefined }
}
