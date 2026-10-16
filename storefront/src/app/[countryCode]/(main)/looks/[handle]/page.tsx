import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { getLookByHandle, getLookWithProducts, listLooks } from "@lib/data/looks"
import { listRegions } from "@lib/data/regions"
import { buildMetaDescription, seoOverride } from "@lib/util/seo"
import { StoreRegion } from "@medusajs/types"
import LookPageSkeleton from "@modules/looks/components/look-page-skeleton"
import LookTemplate from "@modules/looks/templates/look-template"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
}

// Immer dynamisch: Die Seite liest Cookies. Gibt es beim Build keine Looks, hielte
// Next die Route sonst für statisch und jede Look-Seite gäbe zur Laufzeit 500.
export const dynamic = "force-dynamic"

export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const looks = await listLooks()

    const countryCodes = await listRegions().then(
      (regions: StoreRegion[]) =>
        regions
          ?.map((r) => r.countries?.map((c) => c.iso_2))
          .flat()
          .filter(Boolean) as string[]
    )

    return (countryCodes ?? []).flatMap((countryCode) =>
      looks.map((look) => ({ countryCode, handle: look.handle }))
    )
  } catch (error) {
    console.error(
      `Failed to generate static paths for look pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const look = await getLookByHandle(params.handle)

  if (!look) {
    notFound()
  }

  const override = seoOverride(look.metadata)
  const image = look.images?.[0] ?? look.product_thumbnails[0]

  return {
    title: override.title ?? `${look.title} – Shop the Look`,
    description:
      override.description ??
      buildMetaDescription([
        look.description,
        `Look ${look.title} der Strickerei Jutta – ganzes Outfit oder einzelne Teile kaufen`,
      ]),
    alternates: {
      canonical: `/${params.countryCode}/looks/${look.handle}`,
    },
    ...(image ? { openGraph: { images: [image] } } : {}),
  }
}

// Teile samt Preisen laden dauert; bis dahin zeigt die Seite den Platzhalter
async function LookContent({
  handle,
  countryCode,
}: {
  handle: string
  countryCode: string
}) {
  const result = await getLookWithProducts(handle, countryCode)

  if (!result) {
    notFound()
  }

  return (
    <LookTemplate
      look={result.look}
      products={result.products}
      countryCode={countryCode}
    />
  )
}

export default async function LookPage(props: Props) {
  const params = await props.params
  // Vor dem Platzhalter prüfen (gecacht, kurz), damit unbekannte Looks einen
  // echten 404 bekommen: Nach dem Start der Antwort steht der Status auf 200
  const look = await getLookByHandle(params.handle)

  if (!look) {
    notFound()
  }

  return (
    <Suspense fallback={<LookPageSkeleton />}>
      <LookContent handle={params.handle} countryCode={params.countryCode} />
    </Suspense>
  )
}
