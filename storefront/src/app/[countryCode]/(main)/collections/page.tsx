import { redirect } from "next/navigation"

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

// Kollektionen sind nicht mehr in Navigation und Footer, und die Übersicht
// war unfertig (Testkollektionen, fehlende Bilder). Nach Kollektion filtern
// geht in „Alle Produkte“.
export default async function CollectionsOverviewPage(props: Params) {
  const { countryCode } = await props.params
  redirect(`/${countryCode}/store`)
}
