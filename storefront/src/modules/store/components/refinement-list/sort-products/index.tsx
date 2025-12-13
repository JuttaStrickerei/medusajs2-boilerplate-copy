"use client"

import { cn } from "@lib/utils"
import { ChevronDown } from "@components/icons"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions = [
  {
    value: "created_at",
    label: "Neueste",
  },
  {
    value: "price_asc",
    label: "Preis: Aufsteigend",
  },
  {
    value: "price_desc",
    label: "Preis: Absteigend",
  },
] as const

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQueryParams("sortBy", e.target.value as SortOptions)
  }

  const currentLabel = sortOptions.find((o) => o.value === sortBy)?.label || "Sortieren"

  return (
    <div className="relative" data-testid={dataTestId}>
      <select
        value={sortBy}
        onChange={handleChange}
        className={cn(
          "appearance-none w-full",
          "px-4 py-2.5 pr-10",
          "bg-white border border-stone-300 rounded-lg",
          "text-sm text-stone-700",
          "focus:outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-500/20",
          "cursor-pointer transition-colors"
        )}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none"
      />
    </div>
  )
}

export default SortProducts
