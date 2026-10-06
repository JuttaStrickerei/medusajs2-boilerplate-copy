import { LOOKBOOK_SEASON } from "@modules/looks/lib/worlds"

type LooksIntroProps = {
  /** dient der Chip-Leiste als Merkpunkt „ganz oben“ */
  id: string
  count: number
  /** Anzahl der Farbwelten (0 = ein neutrales Band) */
  worldCount: number
}

// Seitenkopf wie bei Kategorien und Kollektionen: Überschrift und eine
// kurze Zeile, damit die Looks gleich darunter beginnen
export default function LooksIntro({ id, count, worldCount }: LooksIntroProps) {
  return (
    <header
      id={id}
      className="content-container pb-5 pt-6 small:pb-6 small:pt-8"
    >
      <h1 className="font-serif text-2xl font-medium text-stone-800 small:text-3xl medium:text-4xl">
        Shop the Look
      </h1>
      {count > 0 && (
        <p className="mt-2 text-sm text-stone-600 small:text-base">
          {LOOKBOOK_SEASON} · {count} {count === 1 ? "Look" : "Looks"}
          {worldCount > 1 ? ` in ${worldCount} Farbwelten` : ""}
        </p>
      )}
    </header>
  )
}
