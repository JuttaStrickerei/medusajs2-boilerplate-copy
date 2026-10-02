import React from "react"

/**
 * Renders a JSON-LD structured-data block for search engines.
 * Server component, no client JS, renders nothing visible.
 */
export default function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      // Escape "<" so text like "</script>" in a product field cannot end
      // the script block (as recommended in the Next.js JSON-LD docs)
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}
