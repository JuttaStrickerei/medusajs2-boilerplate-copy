"use client"

import type { CSSProperties, ReactNode } from "react"

import { trackEvent } from "@lib/util/analytics"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type TrackedLinkProps = {
  href: string
  /** GA4-Ereignis beim Klick (feuert nur nach Cookie-Zustimmung) */
  event: string
  params: Record<string, unknown>
  className?: string
  style?: CSSProperties
  children: ReactNode
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}

/**
 * LocalizedClientLink mit Klick-Tracking. Server-Komponenten können keine
 * onClick-Funktion übergeben, daher dieser kleine Client-Wrapper.
 */
export default function TrackedLink({
  href,
  event,
  params,
  children,
  ...rest
}: TrackedLinkProps) {
  return (
    <LocalizedClientLink
      href={href}
      onClick={() => trackEvent(event, params)}
      {...rest}
    >
      {children}
    </LocalizedClientLink>
  )
}
