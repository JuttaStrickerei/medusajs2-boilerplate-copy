"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { trackMetaPageView } from "@lib/util/meta-pixel"

/**
 * Counts client-side page changes for the Meta Pixel (the App Router does not
 * reload the page). Does nothing without marketing consent.
 */
export default function MetaPageView() {
  const pathname = usePathname()

  useEffect(() => {
    trackMetaPageView(pathname)
  }, [pathname])

  return null
}
