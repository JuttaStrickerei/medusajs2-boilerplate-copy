import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

/**
 * Converts an amount to a localized currency string
 * Defaults to Austrian German locale (de-AT) for proper European formatting
 * Examples: €12,00 / €1.234,56
 */
export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  locale = "de-AT",
}: ConvertToLocaleParams) => {
  return currency_code && !isEmpty(currency_code)
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency_code,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount)
    : amount.toString()
}

/**
 * Formats a price amount (in cents) for display
 * @param amount - Price in cents
 * @param currencyCode - Currency code (e.g., "EUR")
 * @returns Formatted price string (e.g., "€ 12,00")
 */
export const formatPriceFromCents = (
  amount: number,
  currencyCode: string = "EUR"
): string => {
  const amountInEuros = amount / 100
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInEuros)
}
