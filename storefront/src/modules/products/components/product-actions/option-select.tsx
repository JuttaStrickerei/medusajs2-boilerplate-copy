import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"
import type { OptionValueAvailability } from "@modules/products/hooks/use-variant-selection"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
  // Optional: Lagerstatus je Wert anzeigen (ausverkauft, nur noch X, …)
  availability?: Record<string, OptionValueAvailability>
}

const SIZE_ORDER: Record<string, number> = {
  XXS: 0,
  XS: 1,
  S: 2,
  M: 3,
  L: 4,
  XL: 5,
  XXL: 6,
  "2XL": 7,
  "3XL": 8,
  "34": 34,
  "36": 36,
  "38": 38,
  "40": 40,
  "42": 42,
  "44": 44,
  "46": 46,
  "48": 48,
}

const normalizeSizeValue = (value: string) =>
  value.trim().toUpperCase().replace(/\s+/g, "")

const getSizeRank = (value: string): number => {
  const normalized = normalizeSizeValue(value)

  if (normalized in SIZE_ORDER) {
    return SIZE_ORDER[normalized]
  }

  if (/^\d+([.,]\d+)?$/.test(normalized)) {
    return Number.parseFloat(normalized.replace(",", "."))
  }

  return Number.POSITIVE_INFINITY
}

const isSizeOption = (title: string) => {
  const normalizedTitle = title.trim().toLowerCase()
  return (
    normalizedTitle.includes("size") ||
    normalizedTitle.includes("größe") ||
    normalizedTitle.includes("groesse")
  )
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
  availability,
}) => {
  const optionValues = (option.values ?? []).map((v) => v.value)
  // FIX: Analysis result - storefront rendered API option order as-is; enforce deterministic size ordering in frontend.
  const filteredOptions = isSizeOption(title)
    ? [...optionValues].sort((a, b) => {
        const aRank = getSizeRank(a)
        const bRank = getSizeRank(b)

        if (aRank !== bRank) {
          return aRank - bRank
        }

        return a.localeCompare(b, "de", { numeric: true, sensitivity: "base" })
      })
    : optionValues

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm font-medium text-stone-700">{title}</span>
      <div
        className="flex flex-wrap justify-between gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          if (availability) {
            return (
              <AvailabilityOptionButton
                key={v}
                value={v}
                selected={v === current}
                availability={availability[v]}
                disabled={disabled}
                onSelect={() => updateOption(option.id, v)}
              />
            )
          }

          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "border-ui-border-base bg-ui-bg-subtle border text-small-regular h-10 rounded-rounded p-2 flex-1 ",
                {
                  "border-ui-border-interactive": v === current,
                  "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                    v !== current,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const AvailabilityOptionButton = ({
  value,
  selected,
  availability,
  disabled,
  onSelect,
}: {
  value: string
  selected: boolean
  availability?: OptionValueAvailability
  disabled: boolean
  onSelect: () => void
}) => {
  const status = availability?.status ?? "available"
  const isSoldOut = status === "soldout"
  const isUnavailable = status === "unavailable"
  const statusLabel = isUnavailable
    ? "nicht verfügbar"
    : isSoldOut
    ? "ausverkauft"
    : status === "low"
    ? `nur noch ${availability?.quantity}`
    : undefined

  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <button
        type="button"
        onClick={onSelect}
        className={clx(
          "border text-small-regular h-10 w-full rounded-rounded p-2",
          selected
            ? "border-ui-border-interactive"
            : "border-ui-border-base",
          isSoldOut || isUnavailable
            ? "bg-stone-50 text-stone-400 line-through"
            : "bg-ui-bg-subtle",
          !selected &&
            !isUnavailable &&
            "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150",
          isUnavailable && "cursor-not-allowed"
        )}
        disabled={disabled || isUnavailable}
        aria-pressed={selected}
        aria-label={statusLabel ? `${value} (${statusLabel})` : value}
        data-testid="option-button"
      >
        {value}
      </button>
      {status === "low" && (
        <span className="text-[11px] leading-none text-amber-700">
          Nur noch {availability?.quantity}
        </span>
      )}
    </div>
  )
}

export default OptionSelect
