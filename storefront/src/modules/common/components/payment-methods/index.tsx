import { PAYMENT_METHODS } from "@lib/util/shop-facts"
import { cn } from "@lib/utils"

/**
 * Zeigt die Zahlungsarten schon vor der Kasse (Produktseite, Warenkorb, Fußzeile).
 * Alle Symbole stammen aus einem Satz und sind gleich groß; die Dateien liegen
 * unverändert in public/images/payment (Quelle und Lizenz in der LICENSE.txt dort).
 */
export default function PaymentMethods({
  className,
  label = "Zahlung mit",
  dark = false,
  large = false,
}: {
  className?: string
  label?: string
  dark?: boolean
  /** Größere Symbole für Stellen, an denen sie allein stehen (Warenkorb, Fußzeile). */
  large?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs",
        dark ? "text-stone-400" : "text-stone-500",
        className
      )}
      data-testid="payment-methods"
    >
      {label && <span>{label}</span>}
      <ul className="flex items-center gap-1.5" aria-label="Zahlungsarten">
        {PAYMENT_METHODS.map((method) => (
          <li key={method.name}>
            {/* Statische SVG-Datei: bewusst ohne next/image, dort gäbe es nichts zu verkleinern */}
            <img
              src={method.icon}
              alt={method.name}
              width={38}
              height={24}
              loading="lazy"
              decoding="async"
              className={cn("block w-auto", large ? "h-7" : "h-6")}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
