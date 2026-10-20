// GA4 measurement ID. Public anyway (it is in every page).
export const GA_ID = "G-VQG5PFKSXB"

let gaLoaded = false
let scriptLoaded = false

/**
 * gtag.js once per page, shared by GA4 ("analytics" consent) and the Google
 * Ads tag ("marketing" consent, google-ads.ts). Loaded with the ID of the
 * first caller, so marketing consent alone does not load the GA4 container.
 */
export function loadGtagScript(id: string): void {
  if (typeof window === "undefined" || scriptLoaded) return
  scriptLoaded = true
  gtag("js", new Date())
  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(script)
}

/**
 * Loads gtag.js once the visitor accepted "analytics" in the cookie banner
 * (banner click, or the saved choice on a later visit). Before that,
 * app/layout.tsx only sets up the gtag queue with Consent Mode defaults, so
 * nothing reaches Google, not even the cookieless pings of Consent Mode, as
 * the privacy page says. Withdrawing consent reloads the page (cookie
 * banner), so the script is gone again afterwards.
 */
export function loadGoogleAnalytics(): void {
  if (typeof window === "undefined" || gaLoaded) return
  gaLoaded = true
  // Consent first, then config: the first page_view already counts as granted
  gtag("consent", "update", { analytics_storage: "granted" })
  loadGtagScript(GA_ID)
  gtag("config", GA_ID)
}
