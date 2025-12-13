export { cn } from "./cn"
export * from "./animations"

/**
 * Format price with currency (Austrian format)
 * Always shows 2 decimal places for consistency (€ 10,00 not € 10)
 * Note: Medusa API returns prices in the smallest currency unit (cents)
 * This function does NOT divide by 100 - use the raw amount from Medusa
 */
export function formatPrice(
  amount: number | string,
  currency: string = "EUR",
  locale: string = "de-AT"
): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount)
}

/**
 * Format date
 */
export function formatDate(
  date: string | Date,
  locale: string = "de-AT",
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(dateObj)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + "..."
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Check if product is new (within last 30 days)
 */
export function isProductNew(createdAt: string | Date, daysThreshold: number = 30): boolean {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= daysThreshold
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0) return 0
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}

/**
 * Slugify string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Check if we're on the client side
 */
export const isClient = typeof window !== "undefined"

/**
 * Check if we're on the server side
 */
export const isServer = typeof window === "undefined"

