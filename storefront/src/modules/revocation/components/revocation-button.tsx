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
  // "light" = for dark backgrounds (footer), "dark" = for light backgrounds
  variant?: "light" | "dark"
  className?: string
  onClick?: () => void
}) {
  return (
    <LocalizedClientLink
      href="/vertrag-widerrufen"
      onClick={onClick}
      className={clx(
        "inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg border-2 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        variant === "light"
          ? "border-white text-white hover:bg-white hover:text-stone-900 focus-visible:ring-white focus-visible:ring-offset-stone-800"
          : "border-stone-800 bg-stone-800 text-white hover:bg-stone-900 focus-visible:ring-stone-800",
        className
      )}
    >
      Vertrag widerrufen
    </LocalizedClientLink>
  )
}
