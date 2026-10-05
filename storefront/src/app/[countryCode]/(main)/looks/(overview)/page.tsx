import { Metadata } from "next"

import { listLooks, listLooksForOverview } from "@lib/data/looks"
import { buildMetaDescription } from "@lib/util/seo"
import {
  buildOverview,
  minioHostFrom,
  MIN_LOOKS_FOR_WORLDS,
} from "@modules/looks/lib/overview"
import { LOOK_WORLDS, LOOKS_OG_IMAGE } from "@modules/looks/lib/worlds"
import LooksOverview from "@modules/looks/templates/looks-overview"

// Immer dynamisch wie die Look-Seiten: Gibt es beim Build keine Looks, hielte
// Next die Route sonst für statisch.
export const dynamic = "force-dynamic"

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

const FALLBACK_DESCRIPTION =
  "Kombinierte Outfits der Strickerei Jutta – entdecken Sie abgestimmte Looks und kaufen Sie das ganze Outfit oder einzelne Teile."

export async function generateMetadata(props: Params): Promise<Metadata> {
  const { countryCode } = await props.params
  // Gleicher (gecachter) Aufruf wie die Seite, nur für die Anzahl
  const looks = await listLooks()
  const description =
    looks.length >= MIN_LOOKS_FOR_WORLDS
      ? buildMetaDescription(
          [
            `${
              looks.length
            } abgestimmte Outfits der Strickerei Jutta aus Draßburg, geordnet nach Farbwelten: ${LOOK_WORLDS.map(
              (w) => w.name
            ).join(", ")}`,
          ],
          155
        )
      : FALLBACK_DESCRIPTION

  return {
    title: "Shop the Look – Outfits nach Farbwelten",
    description,
    alternates: {
      canonical: `/${countryCode}/looks`,
    },
    // Ein 2:3-Foto würde auf 1.91:1 schlecht beschnitten: ohne eigenes Bild
    // bleibt das Standardbild der Seite
    ...(LOOKS_OG_IMAGE ? { openGraph: { images: [LOOKS_OG_IMAGE] } } : {}),
  }
}

export default async function LooksOverviewPage(props: Params) {
  const { countryCode } = await props.params
  const { looks, products } = await listLooksForOverview(countryCode)
  const overview = buildOverview({
    looks,
    products,
    minioHost: minioHostFrom(process.env.NEXT_PUBLIC_MINIO_ENDPOINT),
  })

  return <LooksOverview overview={overview} countryCode={countryCode} />
}
