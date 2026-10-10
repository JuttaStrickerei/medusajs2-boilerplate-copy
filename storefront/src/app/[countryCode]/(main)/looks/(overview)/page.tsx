import { Metadata } from "next"

import LooksSeasonPage, {
  looksSeasonMetadata,
} from "@modules/looks/templates/looks-season-page"

// Immer dynamisch wie die Look-Seiten: Gibt es beim Build keine Looks, hielte
// Next die Route sonst für statisch.
export const dynamic = "force-dynamic"

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

// /looks zeigt die aktuelle Saison (Saison = Kollektion der Teile)
export async function generateMetadata(props: Params): Promise<Metadata> {
  const { countryCode } = await props.params
  return looksSeasonMetadata({ countryCode, seasonHandle: null })
}

export default async function LooksOverviewPage(props: Params) {
  const { countryCode } = await props.params
  return <LooksSeasonPage countryCode={countryCode} seasonHandle={null} />
}
