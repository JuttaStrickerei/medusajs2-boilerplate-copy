import { forwardRef, useImperativeHandle, useMemo, useRef } from "react"

import NativeSelect, {
  NativeSelectProps,
} from "@modules/common/components/native-select"
import { HttpTypes } from "@medusajs/types"

// Medusa liefert die Ländernamen auf Englisch („Austria“). Deutsch über die
// Sprachdaten von Browser/Server, sonst der Name aus Medusa.
const germanCountryName = (() => {
  let names: Intl.DisplayNames | null = null
  try {
    names = new Intl.DisplayNames(["de-AT", "de"], { type: "region" })
  } catch {
    names = null
  }
  return (iso2: string | undefined, fallback: string) => {
    if (!names || !iso2) return fallback
    try {
      return names.of(iso2.toUpperCase()) || fallback
    } catch {
      return fallback
    }
  }
})()

const CountrySelect = forwardRef<
  HTMLSelectElement,
  NativeSelectProps & {
    region?: HttpTypes.StoreRegion
  }
>(({ placeholder = "Land", region, defaultValue, ...props }, ref) => {
  const innerRef = useRef<HTMLSelectElement>(null)

  useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
    ref,
    () => innerRef.current
  )

  const countryOptions = useMemo(() => {
    if (!region) {
      return []
    }

    return (region.countries ?? [])
      .map((country) => ({
        value: country.iso_2,
        label: germanCountryName(
          country.iso_2,
          country.display_name ?? country.iso_2 ?? ""
        ),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "de"))
  }, [region])

  return (
    <NativeSelect
      ref={innerRef}
      placeholder={placeholder}
      defaultValue={defaultValue}
      {...props}
    >
      {countryOptions?.map(({ value, label }, index) => (
        <option key={index} value={value}>
          {label}
        </option>
      ))}
    </NativeSelect>
  )
})

CountrySelect.displayName = "CountrySelect"

export default CountrySelect
