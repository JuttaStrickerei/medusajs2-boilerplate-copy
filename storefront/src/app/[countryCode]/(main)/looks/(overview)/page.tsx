import { Metadata } from "next"

import { listLooksForOverview } from "@lib/data/looks"
import { buildOverview, minioHostFrom } from "@modules/looks/lib/overview"
import LooksOverview from "@modules/looks/templates/looks-overview"

export const metadata: Metadata = {
  title: "Shop the Look",
  description:
    "Kombinierte Outfits der Strickerei Jutta – entdecken Sie abgestimmte Looks und kaufen Sie das ganze Outfit oder einzelne Teile.",
}

// Immer dynamisch wie die Look-Seiten: Gibt es beim Build keine Looks, hielte
// Next die Route sonst für statisch.
export const dynamic = "force-dynamic"

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function LooksOverviewPage(props: Params) {
  const { countryCode } = await props.params
  const { looks, products } = await listLooksForOverview(countryCode)
  const overview = buildOverview({
    looks,
    products,
    minioHost: minioHostFrom(process.env.NEXT_PUBLIC_MINIO_ENDPOINT),
  })

  return <LooksOverview overview={overview} />
}
