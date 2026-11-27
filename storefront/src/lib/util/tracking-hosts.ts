/**
 * Tracking scripts (GA4, Google Ads, Meta Pixel) only load on the live shop.
 * The dev storefront on Railway, localhost and previews run the same code and
 * would otherwise report test visits and test orders to Jutta's real GA4
 * property, Google Ads account and Meta dataset. Off these hosts the events
 * still go into the page's queues (window.dataLayer, window.fbq.queue), so a
 * test can see what would have been sent; nothing leaves the browser.
 * NEXT_PUBLIC_TRACKING_HOSTS (comma-separated) overrides the list, e.g. to
 * test tracking on dev on purpose. NEXT_PUBLIC_GA_HOSTS is the older name
 * (GA4 only, before 27.11.2026) and still works.
 */
const TRACKING_HOSTS = (
  process.env.NEXT_PUBLIC_TRACKING_HOSTS ||
  process.env.NEXT_PUBLIC_GA_HOSTS ||
  "shop.strickerei-jutta.at"
)
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean)

export function trackingAllowedHere(): boolean {
  return (
    typeof window !== "undefined" &&
    TRACKING_HOSTS.includes(window.location.hostname)
  )
}
