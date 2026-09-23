import { MetadataRoute } from "next"
import { getBaseURL } from "@lib/util/env"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseURL()

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
