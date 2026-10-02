import { MetadataRoute } from "next"
import { getBaseURL } from "@lib/util/env"

// Only the live shop domain may be indexed. Dev/preview storefronts
// (*.up.railway.app, localhost) would otherwise compete with it as
// duplicate content.
const isProductionHost = (url: string) => {
  try {
    return /(^|\.)strickerei-jutta\.at$/.test(new URL(url).hostname)
  } catch {
    return false
  }
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseURL()

  if (!isProductionHost(baseUrl)) {
    return { rules: { userAgent: "*", disallow: "/" } }
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep crawl budget on catalog pages, not on transactional/private surfaces.
      disallow: [
        "/api/",
        "/*/checkout",
        "/*/cart",
        "/*/account",
        "/*/wishlist",
        "/*/results/",
        "/*/order/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
