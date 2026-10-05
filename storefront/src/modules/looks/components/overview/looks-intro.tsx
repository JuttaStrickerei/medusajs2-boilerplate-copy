import PageHeader from "@modules/common/components/page-header"
import { LOOKBOOK_SEASON } from "@modules/looks/lib/worlds"

type LooksIntroProps = {
  /** dient der Chip-Leiste als Merkpunkt „ganz oben“ */
  id: string
  count: number
  /** Anzahl der Farbwelten (0 = ein neutrales Band) */
  worldCount: number
}

// Gemeinsamer Seitenkopf: Überschrift und eine kurze Zeile, damit die Looks
// gleich darunter beginnen
export default function LooksIntro({ id, count, worldCount }: LooksIntroProps) {
  return (
    <PageHeader
      id={id}
      title="Shop the Look"
      meta={
        count > 0
          ? `${LOOKBOOK_SEASON} · ${count} ${count === 1 ? "Look" : "Looks"}${
              worldCount > 1 ? ` in ${worldCount} Farbwelten` : ""
            }`
          : undefined
      }
    />
  )
}
