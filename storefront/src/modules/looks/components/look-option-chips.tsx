"use client"

import { cn } from "@lib/utils"
import type { OptionValueAvailability } from "@modules/products/hooks/use-variant-selection"
import { getSizeRank } from "@modules/products/components/product-actions/option-select"

// Größen in fester Reihenfolge (XS, S, M, …), wie auf der Produktseite
export const sortSizes = (values: string[]): string[] =>
  [...values].sort((a, b) => {
    const diff = getSizeRank(a) - getSizeRank(b)
    if (diff && !Number.isNaN(diff)) return diff
    return a.localeCompare(b, "de", { numeric: true, sensitivity: "base" })
  })

type LookOptionChipsProps = {
  name: string
  legend: string
  legendVisible?: boolean
  kind: "size" | "color" | "other"
  values: string[]
  current?: string
  availability?: Record<string, OptionValueAvailability>
  onChange: (value: string) => void
  disabled?: boolean
  // rot umrandet, wenn hier noch etwas fehlt
  attention?: boolean
  // markiert die Gruppe, die als Nächstes gewählt werden muss
  missing?: boolean
  // rechts neben der Legende (z. B. Link „Größenberatung“)
  aside?: React.ReactNode
  // Größen-Buttons ab 1024px schmal (Zeile eines Teils neben dem Bild)
  narrow?: boolean
  className?: string
}

/**
 * Auswahl als echte Radio-Buttons (eine Tab-Stelle je Gruppe, Pfeiltasten
 * wechseln) – nur für die Look-Seite, OptionSelect der Produktseite bleibt.
 */
export default function LookOptionChips({
  name,
  legend,
  legendVisible = true,
  kind,
  values,
  current,
  availability,
  onChange,
  disabled,
  attention,
  missing,
  aside,
  narrow,
  className,
}: LookOptionChipsProps) {
  const isSize = kind === "size"

  return (
    <fieldset
      data-option={kind}
      data-missing={missing || undefined}
      className={cn(
        "min-w-0",
        attention && "rounded-lg ring-1 ring-red-300 ring-offset-2",
        className
      )}
    >
      {/* Sichtbare Legende (Farbe, Länge …) links in der Zeile der Buttons:
          spart eine eigene Zeile über ihnen */}
      <legend
        className={cn(
          !legendVisible
            ? "sr-only"
            : aside
            ? "float-left text-sm font-medium text-stone-800"
            : "float-left mr-3 text-xs leading-9 text-stone-600"
        )}
      >
        {legend}
      </legend>
      {aside && <div className="float-right">{aside}</div>}
      <div className={cn("flex flex-wrap gap-1", aside && "clear-both pt-2")}>
        {values.map((value) => {
          const status = availability?.[value]?.status ?? "available"
          const isOut = status === "soldout" || status === "unavailable"
          const isLow = status === "low"
          const srSuffix =
            status === "soldout"
              ? " (ausverkauft)"
              : status === "unavailable"
              ? " (nicht verfügbar)"
              : isLow
              ? ` (nur noch ${availability?.[value]?.quantity})`
              : ""

          return (
            <label
              key={value}
              className={cn(
                "relative flex",
                isSize && "min-w-[2.25rem] max-w-[3.5rem] flex-1",
                !disabled && !isOut && "cursor-pointer"
              )}
            >
              {/* Unsichtbar über dem ganzen Button (statt 1px „sr-only“):
                  so scrollt der Browser beim Tabben den ganzen Button ins
                  Bild und nicht nur einen Punkt an seiner Oberkante */}
              <input
                type="radio"
                className="peer absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
                name={name}
                value={value}
                checked={current === value}
                disabled={!!disabled || isOut}
                onChange={() => onChange(value)}
              />
              <span
                className={cn(
                  "flex w-full items-center justify-center border border-stone-300 bg-white font-medium text-stone-800 transition-colors",
                  isSize
                    ? cn(
                        "h-11 rounded-lg text-xs tabular-nums small:h-10",
                        // „XXXL“ braucht in den schmalen Buttons einer Zeile
                        // (ab 1024px rund 41px) etwas kleinere Schrift, sonst
                        // klebt es am Rand
                        narrow &&
                          value.length >= 4 &&
                          "small:text-[11px] small:tracking-tight"
                      )
                    : "h-9 rounded-full px-3 text-xs",
                  // Die Maus steht auf dem (unsichtbaren) Radio darüber
                  !isOut && current !== value && "peer-hover:border-stone-500",
                  "peer-checked:border-stone-900 peer-checked:bg-stone-900 peer-checked:text-white",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-stone-500 peer-focus-visible:ring-offset-2",
                  "peer-disabled:cursor-not-allowed",
                  isOut
                    ? "bg-stone-50 text-stone-400 line-through"
                    : "peer-disabled:opacity-60"
                )}
              >
                {value}
                {srSuffix && <span className="sr-only">{srSuffix}</span>}
              </span>
              {isLow && (
                <span
                  aria-hidden
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-500"
                />
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
