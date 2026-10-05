import { Metadata } from "next"

import LooksSeasonPage, {
  looksSeasonMetadata,
} from "@modules/looks/templates/looks-season-page"

// Wie /looks immer dynamisch. Liegt in (overview), teilt also dessen
// loading.tsx. Kein redirect() für die aktuelle Saison: Hinter dem
// Lade-Platzhalter käme er nur als Meta-Refresh an, daher Canonical /looks.
export const dynamic = "force-dynamic"

type Params = {
  params: Promise<{
    countryCode: string
    season: string
  }>
}

const decodeHandle = (raw: string): string => {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const { countryCode, season } = await props.params
  return looksSeasonMetadata({
    countryCode,
    seasonHandle: decodeHandle(season),
  })
}

export default async function LooksSeasonArchivePage(props: Params) {
  const { countryCode, season } = await props.params
  return (
    <LooksSeasonPage
      countryCode={countryCode}
      seasonHandle={decodeHandle(season)}
    />
  )
}
