"use client"

import { addLookToCart } from "@lib/data/looks"
import { triggerCartRefresh } from "@lib/context/cart-context"
import { gaCurrency, productToItem, trackEvent } from "@lib/util/analytics"
import { sumLookPrices } from "@lib/util/look-price"
import { cn, formatPrice, shouldReduceMotion } from "@lib/utils"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@components/ui"
import { Check, Heart, Ruler, Share, ShoppingBag } from "@components/icons"
import { useWishlist } from "@lib/context/wishlist-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import { isSizeOption } from "@modules/products/components/product-actions/option-select"
import {
  isVariantInStock,
  sortProductOptions,
  translateOptionTitle,
} from "@modules/products/hooks/use-variant-selection"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import LookItemCard, { LookBulkSize, LookItemSelection } from "./look-item-card"
import LookOptionChips, { sortSizes } from "./look-option-chips"

type LookItemsActionsProps = {
  lookId: string
  lookTitle: string
  products: HttpTypes.StoreProduct[]
}

// Feste deutsche Meldung: Server-Actions liefern in Produktion nur eine
// generische englische Fehlermeldung
const ADD_ERROR =
  "Der Look konnte nicht in den Warenkorb gelegt werden. Bitte versuchen Sie es erneut."

const uniqueValues = (option: HttpTypes.StoreProductOption) =>
  Array.from(new Set((option.values ?? []).map((v) => v.value)))

// Größen-Option mit echter Auswahl (mehr als ein Wert)
const sizeValuesOf = (product: HttpTypes.StoreProduct) => {
  if ((product.variants?.length ?? 0) < 2) return []
  const option = product.options?.find((o) => isSizeOption(o.title ?? ""))
  const values = option ? uniqueValues(option) : []
  return values.length > 1 ? values : []
}

// Was die Karte nach der Vorauswahl melden wird – gilt, bis sie es tut
// (Server-HTML und erster Paint zeigen so schon Summe und „Größe wählen“)
const initialSelection = (
  product: HttpTypes.StoreProduct
): LookItemSelection => {
  const variants = product.variants ?? []
  const purchasable = variants.some(isVariantInStock)

  if (variants.length === 1) {
    const inStock = isVariantInStock(variants[0])
    return {
      purchasable,
      status: inStock ? "ready" : "unavailable",
      variant: inStock ? variants[0] : undefined,
    }
  }

  const next = sortProductOptions(product.options).find(
    (o) => uniqueValues(o).length > 1
  )
  return {
    purchasable,
    status: "incomplete",
    missingLabel: next
      ? translateOptionTitle(next.title ?? "Option")
      : undefined,
  }
}

export default function LookItemsActions({
  lookId,
  lookTitle,
  products,
}: LookItemsActionsProps) {
  const countryCode = useParams().countryCode as string
  const router = useRouter()
  const [selections, setSelections] = useState<
    Record<string, LookItemSelection>
  >({})
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [addedNotice, setAddedNotice] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bulkSize, setBulkSize] = useState<LookBulkSize | null>(null)
  const [attention, setAttention] = useState<{
    seq: number
    target: "size-all" | "rows"
  } | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  // Link zum Selbstkopieren, wenn weder Teilen noch Zwischenablage gehen
  const [shareFallbackUrl, setShareFallbackUrl] = useState<string | null>(null)
  const shareInputRef = useRef<HTMLInputElement>(null)
  const [barHidden, setBarHidden] = useState(false)
  const sizeAllRef = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  // „Alle merken“: alle Teile des Looks auf die Wunschliste (erneut klicken entfernt sie)
  const {
    items: wishlistItems,
    addToWishlist,
    removeFromWishlist,
  } = useWishlist()
  const allWishlisted =
    products.length > 0 &&
    products.every((p) => wishlistItems.some((item) => item.id === p.id))

  const handleWishlistAll = () => {
    if (allWishlisted) {
      products.forEach((p) => removeFromWishlist(p.id))
      return
    }
    products.forEach((p) =>
      addToWishlist({
        id: p.id,
        handle: p.handle || "",
        title: p.title || "",
        thumbnail: p.thumbnail || null,
      })
    )
  }

  const handleShare = async () => {
    const url = window.location.href
    setShareFallbackUrl(null)
    if (navigator.share) {
      try {
        await navigator.share({ title: lookTitle, url })
        return
      } catch (e) {
        // Abbruch durch die Kundin ist kein Fehler
        if (e instanceof DOMException && e.name === "AbortError") return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      later(() => setShareCopied(false), 2000)
    } catch {
      // Zwischenablage nicht erlaubt: Link zum Selbstkopieren anzeigen,
      // sonst bekäme die Kundin gar keine Rückmeldung
      setShareFallbackUrl(url)
    }
  }

  useEffect(() => {
    if (!shareFallbackUrl) return
    shareInputRef.current?.focus({ preventScroll: true })
    shareInputRef.current?.select()
  }, [shareFallbackUrl])

  const handleSelectionChange = useCallback(
    (productId: string, selection: LookItemSelection) => {
      setSelections((prev) => {
        const current = prev[productId]
        if (
          current?.variant?.id === selection.variant?.id &&
          current?.purchasable === selection.purchasable &&
          current?.status === selection.status &&
          current?.missingLabel === selection.missingLabel &&
          current?.selectedSize === selection.selectedSize
        ) {
          return prev
        }
        return { ...prev, [productId]: selection }
      })
    },
    []
  )

  const sel = (p: HttpTypes.StoreProduct) =>
    selections[p.id] ?? initialSelection(p)

  // Nur kaufbare Teile zählen; ausverkaufte werden übersprungen
  const purchasable = products.filter((p) => sel(p).purchasable)
  const soldOut = products.filter((p) => !sel(p).purchasable)
  // Kaufbare Teile, die noch nicht bereit sind (in Anzeige-Reihenfolge)
  const notReady = purchasable.filter((p) => sel(p).status !== "ready")
  const ready = purchasable.length > 0 && notReady.length === 0
  const isSingle = products.length === 1

  // Live-Summe: gewählte Variante, sonst günstigster Preis je Teil
  const total = sumLookPrices(purchasable, (p) =>
    sel(p).status === "ready" ? sel(p).variant : undefined
  )
  const totalText = total
    ? `${total.from ? "ab " : ""}${formatPrice(total.amount, total.currency)}`
    : null

  // „Ihre Größe für alle Teile“: ab zwei Teilen mit Größe und mindestens
  // drei gemeinsamen Größen
  const sizeBearing = purchasable.filter((p) => sizeValuesOf(p).length > 0)
  const sizeCounts = new Map<string, number>()
  sizeBearing.forEach((p) =>
    sizeValuesOf(p).forEach((v) =>
      sizeCounts.set(v, (sizeCounts.get(v) ?? 0) + 1)
    )
  )
  const sharedSizes = sortSizes(
    Array.from(sizeCounts.entries())
      .filter(([, n]) => n >= 2)
      .map(([v]) => v)
  )
  const showSizeAll = sizeBearing.length >= 2 && sharedSizes.length >= 3
  const chosenSizes = sizeBearing.map((p) => sel(p).selectedSize)
  const bulkCurrent =
    chosenSizes.length > 0 &&
    chosenSizes.every((s) => !!s && s === chosenSizes[0])
      ? chosenSizes[0]
      : undefined
  const sizesDiffer = !bulkCurrent && chosenSizes.some(Boolean)
  const allSizesMissing = chosenSizes.every((s) => !s)

  // Hilfszeile „Noch offen: …“
  const missingText = (() => {
    if (!notReady.length) return null
    const groups = new Map<string, string[]>()
    notReady.forEach((p) => {
      const s = sel(p)
      const label =
        s.status === "unavailable"
          ? "verfügbare Variante"
          : s.missingLabel ?? "Auswahl"
      groups.set(label, [...(groups.get(label) ?? []), p.title ?? ""])
    })
    const parts = Array.from(groups.entries()).map(([label, titles]) =>
      titles.length === purchasable.length && titles.length > 2
        ? `${label} für alle ${titles.length} Teile`
        : `${label} für ${titles.join(", ")}`
    )
    return `Noch offen: ${parts.join("; ")}`
  })()

  const firstMissing = notReady[0] ? sel(notReady[0]) : undefined
  const barMissingLabel =
    firstMissing?.status === "unavailable"
      ? "Auswahl prüfen"
      : `${firstMissing?.missingLabel ?? "Auswahl"} wählen`

  // Fehlt etwas: hinscrollen, markieren, erste freie Auswahl fokussieren
  const guideToMissing = () => {
    const target: "size-all" | "rows" =
      showSizeAll && allSizesMissing ? "size-all" : "rows"
    setAttention((a) => ({ seq: (a?.seq ?? 0) + 1, target }))

    const el =
      target === "size-all"
        ? sizeAllRef.current
        : notReady[0]
        ? document.getElementById(`look-piece-${notReady[0].id}`)
        : null
    if (!el) return

    el.scrollIntoView({
      block: "center",
      behavior: shouldReduceMotion() ? "auto" : "smooth",
    })
    const input =
      el.querySelector<HTMLInputElement>(
        "fieldset[data-missing] input:not(:disabled)"
      ) ?? el.querySelector<HTMLInputElement>("fieldset input:not(:disabled)")
    input?.focus({ preventScroll: true })
  }

  const handleAddLook = async () => {
    if (!purchasable.length || isAdding) return
    if (!ready) {
      guideToMissing()
      return
    }

    const chosen = purchasable
      .map((p) => ({ product: p, variant: sel(p).variant! }))
      .filter((c) => !!c.variant)

    setIsAdding(true)
    setError(null)

    try {
      await addLookToCart({
        lookId,
        items: chosen.map((c) => ({ variantId: c.variant.id, quantity: 1 })),
        countryCode,
      })

      triggerCartRefresh()

      const items = chosen.map((c) => ({
        ...productToItem(c.product, c.variant, 1),
        item_list_name: `Look: ${lookTitle}`,
      }))
      trackEvent("add_to_cart", {
        currency: gaCurrency(
          chosen[0]?.variant.calculated_price?.currency_code
        ),
        value: items.reduce((acc, i) => acc + (i.price ?? 0), 0),
        items,
      })

      setAdded(true)
      setAddedNotice(true)
      later(() => setAdded(false), 2500)
      later(() => setAddedNotice(false), 6000)
    } catch {
      setError(ADD_ERROR)
    } finally {
      setIsAdding(false)
    }
  }

  // Mobile Kaufleiste ausblenden, solange die Zusammenfassung sichtbar ist
  // oder schon darüber gescrollt wurde (dann verdeckt sie nie den Footer)
  useEffect(() => {
    const el = summaryRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      ([entry]) =>
        setBarHidden(entry.isIntersecting || entry.boundingClientRect.top < 0),
      { rootMargin: "0px 0px -72px 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const allSoldOut = purchasable.length === 0
  const inlineLabel = isAdding
    ? "Wird hinzugefügt …"
    : added
    ? "Im Warenkorb"
    : allSoldOut
    ? "Look derzeit ausverkauft"
    : isSingle
    ? "In den Warenkorb"
    : soldOut.length > 0
    ? "Look in den Warenkorb"
    : "Ganzen Look in den Warenkorb"
  // Mobil liegt die Bestätigung samt Link unter dem Bildschirmrand: solange
  // sie gilt, führt der Button der Leiste zum Warenkorb (statt den Look ein
  // zweites Mal hinzuzufügen)
  const barGoesToCart = addedNotice && !isAdding
  const barLabel = isAdding
    ? "Wird hinzugefügt …"
    : added
    ? "Im Warenkorb"
    : barGoesToCart
    ? "Zum Warenkorb"
    : allSoldOut
    ? "Ausverkauft"
    : ready
    ? "In den Warenkorb"
    : barMissingLabel

  const buttonIcon = (size: number) =>
    isAdding ? (
      <Spinner size={size} />
    ) : added ? (
      <Check size={size} />
    ) : (
      <ShoppingBag size={size} />
    )

  const pieceLabel = `${products.length} ${
    products.length === 1 ? "Teil" : "Teile"
  }`
  const helperIsAlert = !!attention && !!missingText

  return (
    <div>
      {/* Anker für „3 Teile“ in der Kopfzeile: schließt die Größe für alle
          Teile ein, damit sie nach dem Sprung nicht unter dem Header liegt */}
      <section
        id="look-teile"
        aria-labelledby="look-teile-h"
        className="scroll-mt-20 small:scroll-mt-24"
      >
        <h2 id="look-teile-h" className="sr-only">
          Teile im Look
        </h2>
        {showSizeAll && (
          <div
            ref={sizeAllRef}
            data-testid="look-size-all"
            className="relative mb-4"
          >
            <LookOptionChips
              name="look-size-all"
              legend="Ihre Größe für alle Teile"
              kind="size"
              values={sharedSizes}
              current={bulkCurrent}
              onChange={(value) =>
                setBulkSize((b) => ({ value, seq: (b?.seq ?? 0) + 1 }))
              }
              disabled={isAdding}
              missing={allSizesMissing}
              attention={attention?.target === "size-all" && allSizesMissing}
              aside={
                <a
                  href={`/${countryCode}/size-guide`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="-my-2 flex items-center gap-1 py-2 text-xs text-stone-600 underline underline-offset-4 hover:text-stone-900"
                >
                  <Ruler size={14} aria-hidden />
                  Größenberatung
                  <span className="sr-only">(öffnet in neuem Tab)</span>
                </a>
              }
            />
            {/* steht im Abstand unter den Buttons, damit die Teile darunter
                nicht springen, wenn der Hinweis erscheint */}
            {sizesDiffer && (
              <p className="absolute left-0 top-full text-[11px] leading-4 text-stone-500">
                Individuell gewählt
              </p>
            )}
          </div>
        )}

        <ul className="divide-y divide-stone-200 border-t border-stone-200">
          {products.map((product) => (
            <li key={product.id}>
              <LookItemCard
                product={product}
                disabled={isAdding}
                onSelectionChange={handleSelectionChange}
                bulkSize={bulkSize}
                attention={attention?.target === "rows"}
                showSingleAdd={!isSingle}
              />
            </li>
          ))}
        </ul>
      </section>

      {soldOut.length > 0 && purchasable.length > 0 && (
        <p className="mt-5 text-sm text-stone-600">
          {soldOut.map((p) => p.title).join(", ")}{" "}
          {soldOut.length === 1 ? "ist" : "sind"} derzeit ausverkauft und{" "}
          {soldOut.length === 1 ? "wird" : "werden"} nicht hinzugefügt.
        </p>
      )}

      {/* Zusammenfassung; ab 768px klebt sie unten im Bild, solange die
          Teile-Liste sichtbar ist. Mobil übernimmt die feste Leiste unten. */}
      <div
        ref={summaryRef}
        id="look-summary"
        data-testid="look-summary-sticky"
        className={cn(
          "border-t border-stone-200 bg-stone-50/95 py-3 backdrop-blur-sm tablet:sticky tablet:bottom-0 tablet:z-10 tablet:-mx-1 tablet:px-1 small:py-2",
          soldOut.length > 0 && purchasable.length > 0 ? "mt-3" : "mt-5"
        )}
      >
        <div className="flex flex-col small:flex-row small:flex-wrap small:items-center small:gap-x-4">
          <div className="flex items-baseline justify-between gap-3 small:order-2 small:block small:shrink-0">
            <p className="text-[15px] text-stone-700 small:text-xs small:text-stone-500">
              Ganzer Look
              {/* ab 1024px steht die Anzahl schon in der Kopfzeile; so bleibt
                  Platz für den Button in derselben Zeile */}
              <span className="small:hidden"> · {pieceLabel}</span>
            </p>
            {totalText && (
              <p className="text-right tabular-nums small:text-left">
                {total?.onSale && (
                  <span className="mr-2 text-sm text-stone-400 line-through">
                    {formatPrice(total.original, total.currency)}
                  </span>
                )}
                <span
                  className={cn(
                    "text-lg font-semibold",
                    total?.onSale ? "text-red-700" : "text-stone-900"
                  )}
                >
                  {totalText}
                </span>
              </p>
            )}
          </div>

          <p
            key={helperIsAlert ? attention?.seq : "helper"}
            role={helperIsAlert ? "alert" : undefined}
            aria-live={helperIsAlert ? undefined : "polite"}
            className={cn(
              "text-xs small:order-1 small:w-full",
              missingText && "mt-1 small:mb-0.5 small:mt-0",
              helperIsAlert ? "text-red-700" : "text-stone-600"
            )}
          >
            {missingText}
          </p>

          <Button
            size="lg"
            fullWidth
            onClick={handleAddLook}
            disabled={allSoldOut}
            aria-disabled={isAdding || undefined}
            aria-busy={isAdding || undefined}
            className={cn(
              "mt-2 whitespace-nowrap small:order-3 small:mt-0 small:h-11 small:w-auto small:flex-1 small:px-4 small:text-sm",
              added && "bg-green-600 hover:bg-green-600"
            )}
            leftIcon={buttonIcon(20)}
            data-testid="add-look-button"
          >
            {inlineLabel}
          </Button>
        </div>

        <p
          role="status"
          className={cn("text-xs text-stone-700", addedNotice && "mt-2")}
        >
          {addedNotice && (
            <>
              {lookTitle} liegt im Warenkorb ·{" "}
              <LocalizedClientLink
                href="/cart"
                className="font-medium underline underline-offset-4 hover:text-stone-900"
              >
                Zum Warenkorb →
              </LocalizedClientLink>
            </>
          )}
        </p>
        {error && (
          <p role="alert" className="mt-2 text-xs text-red-700">
            {error}
          </p>
        )}
      </div>

      {/* Buttons so hoch wie die Zeile (44px Tippfläche); gap-4 + px-1 ergibt
          denselben Abstand zwischen den Texten wie vorher gap-6 */}
      <div className="flex h-11 items-center justify-center gap-4 text-[13px] text-stone-600">
        {!isSingle && (
          <button
            type="button"
            onClick={handleWishlistAll}
            className="inline-flex h-11 items-center gap-1.5 px-1 hover:text-stone-900"
          >
            <Heart
              size={14}
              filled={allWishlisted}
              aria-hidden
              className={allWishlisted ? "text-red-500" : ""}
            />
            {allWishlisted ? "Gemerkt" : "Alle merken"}
          </button>
        )}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex h-11 items-center gap-1.5 px-1 hover:text-stone-900"
        >
          {shareCopied ? (
            <Check size={14} aria-hidden />
          ) : (
            <Share size={14} aria-hidden />
          )}
          {shareCopied ? "Link kopiert" : "Teilen"}
        </button>
        <span role="status" className="sr-only">
          {shareCopied
            ? "Link kopiert"
            : shareFallbackUrl
            ? "Link konnte nicht kopiert werden"
            : ""}
        </span>
        <a
          href={`/${countryCode}/size-guide`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-1.5 px-1 hover:text-stone-900"
        >
          <Ruler size={14} aria-hidden />
          Größenberatung
          <span className="sr-only">(öffnet in neuem Tab)</span>
        </a>
      </div>

      {shareFallbackUrl && (
        <div className="mb-3 text-center text-xs text-stone-600">
          <p>Link konnte nicht kopiert werden – bitte hier kopieren:</p>
          <input
            ref={shareInputRef}
            readOnly
            value={shareFallbackUrl}
            aria-label="Link zu diesem Look"
            onFocus={(e) => e.currentTarget.select()}
            className="mt-1.5 w-full rounded-md border border-stone-300 bg-white px-2.5 py-2 text-xs text-stone-800 focus:border-stone-500 focus:outline-none"
          />
        </div>
      )}

      <p className="text-center text-xs text-stone-500">
        inkl. MwSt., zzgl.{" "}
        <a
          href={`/${countryCode}/shipping`}
          className="underline hover:text-stone-700"
        >
          Versandkosten
        </a>
      </p>

      {/* Mobile Kaufleiste: fest unten, ab dem ersten Paint sichtbar */}
      <div
        data-testid="look-sticky-bar"
        data-look-buybar=""
        aria-hidden={barHidden || undefined}
        inert={barHidden || undefined}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-stone-200 bg-white/95 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur duration-200 motion-safe:transition-transform tablet:hidden",
          barHidden && "translate-y-full"
        )}
      >
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500">
            Ganzer Look
          </p>
          {totalText && (
            <p className="text-base font-semibold tabular-nums text-stone-900">
              {totalText}
            </p>
          )}
        </div>
        <Button
          size="lg"
          onClick={
            barGoesToCart
              ? () => router.push(`/${countryCode}/cart`)
              : handleAddLook
          }
          // während des Hinzufügens nicht deaktivieren: der Fokus bliebe sonst
          // nicht auf dem Button (Klicks ignoriert handleAddLook)
          disabled={allSoldOut}
          aria-disabled={isAdding || undefined}
          aria-busy={isAdding || undefined}
          className={cn(
            "h-12 shrink-0 px-5",
            added && "bg-green-600 hover:bg-green-600"
          )}
          leftIcon={buttonIcon(18)}
        >
          {barLabel}
        </Button>
      </div>
    </div>
  )
}
