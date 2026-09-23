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
 */
export function useVariantSelection(product: HttpTypes.StoreProduct) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})

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

  const missingOptions = useMemo(() => {
    if (!product.options || product.options.length === 0) return []
    return product.options.filter((opt) => !options[opt.id])
  }, [product.options, options])

  const allOptionsSelected = missingOptions.length === 0

  // Verfügbarkeit je Optionswert – berücksichtigt die bereits gewählten
  // anderen Optionen (z. B. Größen einer gewählten Farbe)
  const availability = useMemo<OptionsAvailability>(() => {
    const variants = product.variants ?? []
    const result: OptionsAvailability = {}

    for (const option of product.options ?? []) {
      result[option.id] = {}
      for (const { value } of option.values ?? []) {
        const matching = variants.filter((v) => {
          const keymap = optionsAsKeymap(v.options) ?? {}
          if (keymap[option.id] !== value) return false
          return Object.entries(options).every(
            ([optionId, selected]) =>
              optionId === option.id || !selected || keymap[optionId] === selected
          )
        })
        result[option.id][value] = variantAvailability(matching)
      }
    }

    return result
  }, [product.variants, product.options, options])

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

  return {
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
