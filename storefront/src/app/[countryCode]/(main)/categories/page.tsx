import { redirect } from "next/navigation"

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

// Die Kategorien stehen im Menü „Shop“ und im Filter von „Alle Produkte“.
// Eine eigene Übersicht ohne Kategoriebilder wäre nur eine Sackgasse.
export default async function CategoriesOverviewPage(props: Params) {
  const { countryCode } = await props.params
  redirect(`/${countryCode}/store`)
}
