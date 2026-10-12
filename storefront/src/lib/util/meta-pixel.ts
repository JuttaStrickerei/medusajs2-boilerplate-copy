import type { GaItem } from "./analytics"
import { hasConsentFor } from "./consent"
import { META_PIXEL_ID } from "./meta-pixel-id"

/**
 * Meta Pixel (Facebook / Instagram ads). Nothing is loaded and nothing is
 * sent to Meta before the visitor accepted the "marketing" category in the
 * cookie banner: unlike GA's Consent Mode there are no pings before consent.
 * Without NEXT_PUBLIC_META_PIXEL_ID the pixel is off (see meta-pixel-id.ts).
 * autoConfig is off, so Meta only gets the events below and no automatically
 * collected button clicks or page data.
 * Purchase carries the order id as eventID, so a later server-side
 * Conversions API event with the same id is deduplicated by Meta.
 */

export const MARKETING_CATEGORY = "marketing"

const PIXEL_SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js"

type Fbq = {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  push: Fbq
  loaded: boolean
  version: string
}

type MetaWindow = Window & { fbq?: Fbq; _fbq?: Fbq }

let pixelState: "off" | "on" | "revoked" = "off"
// Path of the last PageView, so the route watcher does not count a page twice
let trackedPath: string | null = null

// Meta's base code: a queueing stub until fbevents.js has loaded
function installFbq(w: MetaWindow): Fbq {
  if (w.fbq) return w.fbq

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, args)
    } else {
      fbq.queue.push(args)
    }
  } as Fbq
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = "2.0"
  fbq.queue = []
  w.fbq = fbq
  if (!w._fbq) w._fbq = fbq

  const script = document.createElement("script")
  script.async = true
  script.src = PIXEL_SCRIPT_SRC
  document.head.appendChild(script)

  return fbq
}

/**
 * Call once marketing consent is given (banner click, or the saved choice on
 * a later visit): loads the pixel and counts the current page.
 */
export function enableMetaPixel(): void {
  if (typeof window === "undefined" || !META_PIXEL_ID || pixelState === "on") {
    return
  }
  const fbq = installFbq(window as MetaWindow)
  if (pixelState === "revoked") {
    fbq("consent", "grant")
  } else {
    fbq("set", "autoConfig", false, META_PIXEL_ID)
    fbq("init", META_PIXEL_ID)
    fbq("track", "PageView")
    trackedPath = window.location.pathname
  }
  pixelState = "on"
}

/**
 * Call when marketing consent is withdrawn. The banner also deletes the
 * _fbp/_fbc cookies and reloads the page, so the script is gone afterwards.
 */
export function disableMetaPixel(): void {
  if (typeof window === "undefined" || pixelState !== "on") return
  ;(window as MetaWindow).fbq?.("consent", "revoke")
  pixelState = "revoked"
}

// The pixel, if consent is saved. Shop events can fire before the banner
// script has run (e.g. ViewContent on a product page opened from an ad), so a
// saved consent switches the pixel on here as well.
function activeFbq(): Fbq | null {
  if (typeof window === "undefined" || !META_PIXEL_ID) return null
  if (!hasConsentFor(MARKETING_CATEGORY)) return null
  if (pixelState === "off") enableMetaPixel()
  return pixelState === "on" ? (window as MetaWindow).fbq ?? null : null
}

/** PageView for client-side navigation (the App Router does not reload) */
export function trackMetaPageView(pathname: string): void {
  const fbq = activeFbq()
  if (!fbq || pathname === trackedPath) return
  trackedPath = pathname
  fbq("track", "PageView")
}

type MetaEvent = {
  name: string
  data: Record<string, unknown>
  eventId?: string
}

// GA4 e-commerce event → Meta standard event (others are not sent to Meta)
function toMetaEvent(
  gaName: string,
  params: Record<string, unknown>
): MetaEvent | null {
  const items = Array.isArray(params.items) ? (params.items as GaItem[]) : []
  const numItems = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0)
  const shared = {
    content_type: "product",
    content_ids: items.map((item) => item.item_id),
    contents: items.map((item) => ({
      id: item.item_id,
      quantity: item.quantity ?? 1,
      ...(typeof item.price === "number" ? { item_price: item.price } : {}),
    })),
    currency: params.currency,
    value: params.value,
  }

  switch (gaName) {
    case "view_item":
      return {
        name: "ViewContent",
        data: { ...shared, content_name: items[0]?.item_name },
      }
    case "add_to_cart":
      return { name: "AddToCart", data: shared }
    case "begin_checkout":
      return {
        name: "InitiateCheckout",
        data: { ...shared, num_items: numItems },
      }
    case "purchase":
      return {
        name: "Purchase",
        data: { ...shared, num_items: numItems },
        eventId:
          typeof params.transaction_id === "string"
            ? params.transaction_id
            : undefined,
      }
    default:
      return null
  }
}

export function trackMetaEvent(
  gaName: string,
  params: Record<string, unknown>
): void {
  const event = toMetaEvent(gaName, params)
  if (!event) return
  const fbq = activeFbq()
  if (!fbq) return
  if (event.eventId) {
    fbq("track", event.name, event.data, { eventID: event.eventId })
  } else {
    fbq("track", event.name, event.data)
  }
}
