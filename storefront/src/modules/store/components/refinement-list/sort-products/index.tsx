"use client"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"
import { useTranslations } from "next-intl"
import { use } from "react"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  // Move the useLanguage hook inside the component
  const t = useTranslations('store')
  
  // Define sortOptions inside the component with proper t function calls
  const sortOptions = [
    {
      value: "created_at",
      label: t('latestarrivals'),
    },
    {
      value: "price_asc",
      label: t('lowtohigh'),
    },
    {
      value: "price_desc",
      label: t('hightolow'),
    },
  ]

  const handleChange = (value: SortOptions) => {
    setQueryParams("sortBy", value)
  }
  
  return (
    <FilterRadioGroup
      title={t('sortBy')}
      items={sortOptions}
      value={sortBy}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts