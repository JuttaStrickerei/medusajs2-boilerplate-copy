import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@medusajs/ui"

/**
 * Entry point for the online withdrawal (§ 13a FAGG).
 * The label "Vertrag widerrufen" is prescribed by law — do not change it.
 */
export default function RevocationButton({
  variant = "dark",
  className,
  onClick,
}: {
  // "light" = for dark backgrounds, "dark" = for light backgrounds,
  // "subtle" = understated outline for the footer's legal bar (still a
  // bordered, readable button as the law requires it to stand out)
  variant?: "light" | "dark" | "subtle"
  className?: string
  onClick?: () => void
}) {
  return (
    <LocalizedClientLink
      href="/vertrag-widerrufen"
      onClick={onClick}
      className={clx(
        "inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        variant === "subtle"
          ? "min-h-[32px] px-3 py-1 border border-stone-500 text-sm text-stone-300 hover:border-white hover:text-white focus-visible:ring-white focus-visible:ring-offset-stone-800"
          : "min-h-[44px] px-5 py-2.5 border-2 text-base font-semibold",
        variant === "light" &&
          "border-white text-white hover:bg-white hover:text-stone-900 focus-visible:ring-white focus-visible:ring-offset-stone-800",
        variant === "dark" &&
          "border-stone-800 bg-stone-800 text-white hover:bg-stone-900 focus-visible:ring-stone-800",
        className
      )}
    >
      Vertrag widerrufen
    </LocalizedClientLink>
  )
}
