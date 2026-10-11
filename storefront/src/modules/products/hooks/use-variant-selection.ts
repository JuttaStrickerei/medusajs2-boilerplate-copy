"use client"

import { HttpTypes } from "@medusajs/types"
import { isEqual } from "lodash"
import { useCallback, useEffect, useMemo, useState } from "react"

// Ab dieser Menge (inkl.) wird „Nur noch X“ angezeigt
export const LOW_STOCK_THRESHOLD = 2

export type OptionValueAvailability = {
  status: "available" | "low" | "soldout" | "unavailable"
  quantity?: number
}

// optionId -> Wert -> Verfügbarkeit
export type OptionsAvailability = Record<
  string,
  Record<string, OptionValueAvailability>
>

export const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export const isVariantInStock = (
  variant?: HttpTypes.StoreProductVariant | null
) => {
  if (!variant) return false
  // If we don't manage inventory, we can always add to cart
  if (!variant.manage_inventory) return true
  // If we allow back orders on the variant, we can add to cart
  if (variant.allow_backorder) return true
  // If there is inventory available, we can add to cart
  return (variant.inventory_quantity || 0) > 0
}

export const translateOptionTitle = (title: string): string => {
  const map: Record<string, string> = {
    color: "Farbe",
    colour: "Farbe",
    size: "Größe",
    material: "Material",
    style: "Stil",
    length: "Länge",
    width: "Breite",
  }
  return map[title.trim().toLowerCase()] ?? title
}

// Feste Reihenfolge der Optionen: Farbe, dann Größe, dann der Rest.
// Medusa liefert product.options ohne garantierte Reihenfolge (z. B. ändert
// sie sich, wenn eine Farbe ergänzt wird) – so bleibt die Anzeige stabil.
const optionRank = (title?: string | null) => {
  const t = (title ?? "").trim().toLowerCase()
  if (["farbe", "color", "colour"].includes(t)) return 0
  if (["größe", "groesse", "size"].includes(t)) return 1
  return 2
}

export const sortProductOptions = <T extends { title?: string | null }>(
  options: T[] | null | undefined
): T[] =>
  (options ?? [])
    .map((option, index) => ({ option, index }))
    .sort(
      (a, b) =>
        optionRank(a.option.title) - optionRank(b.option.title) ||
        a.index - b.index
    )
    .map(({ option }) => option)

const variantAvailability = (
  variants: HttpTypes.StoreProductVariant[]
): OptionValueAvailability => {
  if (!variants.length) return { status: "unavailable" }

  if (variants.some((v) => !v.manage_inventory || v.allow_backorder)) {
    return { status: "available" }
  }

  const quantity = Math.max(...variants.map((v) => v.inventory_quantity || 0))

  if (quantity <= 0) return { status: "soldout" }
  if (quantity <= LOW_STOCK_THRESHOLD) return { status: "low", quantity }
  return { status: "available", quantity }
}

/**
 * Optionsauswahl, gewählte Variante und Lagerstatus eines Produkts.
 * Wird von der Produktseite (ProductActions) und der Look-Seite genutzt.
 * initialOptions: Vorauswahl beim ersten Rendern (Look-Seite: Farbe des Looks).
 */
export function useVariantSelection(
  product: HttpTypes.StoreProduct,
  initialOptions?: Record<string, string>
) {
  const [options, setOptions] = useState<Record<string, string | undefined>>(
    () => initialOptions ?? {}
  )

  // Preselect options: all options if only 1 variant, otherwise any option with only 1 available value
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    } else {
      const preselectMap: Record<string, string> = {}
      for (const option of product.options ?? []) {
        const uniqueValues = Array.from(
          new Set((option.values ?? []).map((v) => v.value))
        )
        if (uniqueValues.length === 1) {
          preselectMap[option.id] = uniqueValues[0]
        }
      }
      if (Object.keys(preselectMap).length > 0) {
        // Ergänzen statt ersetzen: Nach „In den Warenkorb“ kommt dasselbe
        // Produkt als neues Objekt – die gewählte Größe muss erhalten bleiben
        setOptions((prev) => ({ ...prev, ...preselectMap }))
      }
    }
  }, [product.variants, product.options])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = useCallback((optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }, [])

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // check if the selected variant is in stock
  const inStock = useMemo(
    () => isVariantInStock(selectedVariant),
    [selectedVariant]
  )

  const orderedOptions = useMemo(
    () => sortProductOptions(product.options),
    [product.options]
  )

  const missingOptions = useMemo(() => {
    if (orderedOptions.length === 0) return []
    return orderedOptions.filter((opt) => !options[opt.id])
  }, [orderedOptions, options])

  const allOptionsSelected = missingOptions.length === 0

  // Verfügbarkeit je Optionswert. Berücksichtigt nur die Auswahl der Optionen
  // DAVOR (Farbe vor Größe): Größen zeigen den Bestand der gewählten Farbe,
  // Farben werden von einer gewählten Größe nicht beeinflusst.
  const availability = useMemo<OptionsAvailability>(() => {
    const variants = product.variants ?? []
    const result: OptionsAvailability = {}

    orderedOptions.forEach((option, index) => {
      const previous = orderedOptions.slice(0, index)
      result[option.id] = {}
      for (const { value } of option.values ?? []) {
        const matching = variants.filter((v) => {
          const keymap = optionsAsKeymap(v.options) ?? {}
          if (keymap[option.id] !== value) return false
          return previous.every(
            (prev) => !options[prev.id] || keymap[prev.id] === options[prev.id]
          )
        })
        result[option.id][value] = variantAvailability(matching)
      }
    })

    return result
  }, [product.variants, orderedOptions, options])

  // Ist irgendeine Variante des Produkts kaufbar?
  const isPurchasable = useMemo(
    () => (product.variants ?? []).some(isVariantInStock),
    [product.variants]
  )

  // Bild zur aktuellen Auswahl (z. B. gewählte Farbe), sonst Produktbild
  const previewImage = useMemo(() => {
    const selected = Object.entries(options).filter(([, v]) => !!v)
    const match =
      selectedVariant ??
      (selected.length
        ? product.variants?.find((v) => {
            const keymap = optionsAsKeymap(v.options) ?? {}
            return selected.every(([id, value]) => keymap[id] === value)
          })
        : undefined)

    return (
      match?.thumbnail ||
      match?.images?.[0]?.url ||
      product.thumbnail ||
      product.images?.[0]?.url ||
      null
    )
  }, [options, selectedVariant, product])

  // Zustand der Auswahl für Button-Texte:
  // incomplete = noch nicht alles gewählt, unavailable = Kombination gibt es
  // nicht oder ausverkauft, ready = lieferbare Variante gewählt
  const selectionStatus: "ready" | "incomplete" | "unavailable" =
    !allOptionsSelected
      ? "incomplete"
      : !isValidVariant || !inStock
      ? "unavailable"
      : "ready"

  return {
    orderedOptions,
    selectionStatus,
    options,
    setOptionValue,
    selectedVariant,
    isValidVariant,
    inStock,
    missingOptions,
    allOptionsSelected,
    availability,
    isPurchasable,
    previewImage,
  }
}
