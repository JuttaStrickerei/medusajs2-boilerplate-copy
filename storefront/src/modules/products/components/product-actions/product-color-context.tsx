"use client"

import { HttpTypes } from "@medusajs/types"
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react"
import { COLOR_PARAM, defaultColor, matchColor } from "@lib/util/product-colors"

// Gewählte Farbe der Produktseite, geteilt zwischen Galerie und Kaufbereich.
//
// Die Seite wird statisch erzeugt und kennt die Adresse nicht. Das erste
// Rendern zeigt darum immer die Farbe des ersten Galeriebilds (auf dem Server
// und im Browser gleich, sonst passt die Hydration nicht); ?farbe=… wird
// direkt danach übernommen, noch bevor der Browser zeichnet.
//
// Die Farbe liegt in einem kleinen Speicher statt im Zustand des Providers:
// Der Kaufbereich steckt in einer Suspense-Grenze, die später hydriert. Ein
// geänderter Kontextwert davor würde React zwingen, sie neu aufzubauen.

type ColorStore = {
  get: () => string | undefined
  set: (color: string) => void
  subscribe: (listener: () => void) => () => void
}

const createColorStore = (initial?: string): ColorStore => {
  let current = initial
  const listeners = new Set<() => void>()
  return {
    get: () => current,
    set: (color) => {
      if (color === current) return
      current = color
      listeners.forEach((listener) => listener())
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

type ProductColorContextValue = {
  /** Produkt der Seite, geladen mit den Bild-IDs der Varianten */
  product: HttpTypes.StoreProduct
  /** Farbe des ersten Galeriebilds; undefined bei nur einer Farbe */
  initial?: string
  store: ColorStore
}

const ProductColorContext = createContext<ProductColorContextValue | null>(null)

export function ProductColorProvider({
  product,
  children,
}: {
  product: HttpTypes.StoreProduct
  children: React.ReactNode
}) {
  const initial = useMemo(() => defaultColor(product), [product])
  const [store] = useState(() => createColorStore(initial))

  // Nur beim ersten Anzeigen: danach bestimmt die Kundin die Farbe
  useLayoutEffect(() => {
    const fromUrl = matchColor(
      product,
      new URLSearchParams(window.location.search).get(COLOR_PARAM)
    )
    if (fromUrl) store.set(fromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({ product, initial, store }),
    [product, initial, store]
  )

  return (
    <ProductColorContext.Provider value={value}>
      {children}
    </ProductColorContext.Provider>
  )
}

/**
 * Gewählte Farbe und die Funktion zum Wechseln. `color` ist nur bei Produkten
 * mit mehreren Farben gesetzt; ohne Provider bleibt alles wie ohne Farbwahl.
 */
export function useProductColor() {
  const context = useContext(ProductColorContext)
  const product = context?.product
  const store = context?.store
  const [color, setColor] = useState(context?.initial)

  // Layout-Effekt: Die Farbe aus der Adresse steht, bevor der Browser zeichnet
  useLayoutEffect(() => {
    if (!store) return
    const sync = () => setColor(store.get())
    sync()
    return store.subscribe(sync)
  }, [store])

  const selectColor = useCallback(
    (value: string) => {
      if (!product || !store) return
      const next = matchColor(product, value)
      if (!next) return
      store.set(next)

      // Adresse ohne Navigation anpassen: „Teilen“, Neuladen und Zurück
      // behalten die Farbe. null als Zustand, damit Next die neue Adresse in
      // seinen Router übernimmt (sonst setzt er sie beim nächsten Aktualisieren zurück).
      try {
        const url = new URL(window.location.href)
        url.searchParams.set(COLOR_PARAM, next)
        window.history.replaceState(
          null,
          "",
          `${url.pathname}${url.search}${url.hash}`
        )
      } catch {
        // Safari begrenzt replaceState (100-mal in 30 s): Die Farbe wechselt trotzdem
      }
    },
    [product, store]
  )

  return { color, selectColor, product }
}
