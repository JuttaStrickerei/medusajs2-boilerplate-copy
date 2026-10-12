// GA4 measurement ID. Public anyway (it is in every page).
export const GA_ID = "G-VQG5PFKSXB"

const GA_SCRIPT_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`

let gaLoaded = false

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
  gtag("js", new Date())
  gtag("config", GA_ID)

  const script = document.createElement("script")
  script.async = true
  script.src = GA_SCRIPT_SRC
  document.head.appendChild(script)
}
