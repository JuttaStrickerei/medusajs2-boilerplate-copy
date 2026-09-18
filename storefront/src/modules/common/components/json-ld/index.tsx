import React from "react"

/**
 * Renders a JSON-LD structured-data block for search engines.
 * Server component, no client JS, renders nothing visible.
 */
export default function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
