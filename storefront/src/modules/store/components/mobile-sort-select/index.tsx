"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { cn } from "@lib/utils"
import { ChevronDown } from "@components/icons"
import { SortOptions } from "../refinement-list/sort-products"

interface MobileSortSelectProps {
  sortBy: SortOptions
}

const sortOptions = [
  { value: "created_at", label: "Neueste" },
  { value: "price_asc", label: "Preis ↑" },
  { value: "price_desc", label: "Preis ↓" },
] as const

export default function MobileSortSelect({ sortBy }: MobileSortSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const setQueryParams = useCallback(
    (value: SortOptions) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("sortBy", value)
      params.delete("page")
      
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
  )

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQueryParams(e.target.value as SortOptions)
  }

  return (
    <div className={cn("relative", isPending && "opacity-60")}>
      <select
        value={sortBy}
        onChange={handleChange}
        className={cn(
          "appearance-none w-full",
          "px-4 py-3 pr-10",
          "bg-white border border-stone-300 rounded-lg",
          "text-sm font-medium text-stone-700",
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
        size={18}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none"
      />
    </div>
  )
}

