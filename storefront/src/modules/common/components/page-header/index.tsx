import type { ReactNode } from "react"

import { cn } from "@lib/utils"

type PageHeaderProps = {
  title: ReactNode
  /** eine kurze Zeile unter der Überschrift: Saison, Anzahl oder Kurzbeschreibung */
  meta?: ReactNode
  /** id am <header> (Merkpunkt der Chip-Leiste auf /looks) */
  id?: string
  /** Service-Seiten: mittig über einer schmalen Textspalte */
  centered?: boolean
  /** data-testid der Überschrift */
  titleTestId?: string
}

/**
 * Einheitlicher Seitenkopf unter der Brotkrümel-Leiste: Überschrift und
 * höchstens eine kurze Zeile. Kein Kicker, kein Hero, keine zweite Leiste,
 * damit der Inhalt auf jeder Seite an derselben Stelle beginnt.
 */
export default function PageHeader({
  title,
  meta,
  id,
  centered = false,
  titleTestId,
}: PageHeaderProps) {
  return (
    <header
      id={id}
      className={cn(
        "content-container pb-5 pt-6 small:pb-6 small:pt-8",
        centered && "text-center"
      )}
    >
      <h1
        data-testid={titleTestId}
        className="font-serif text-2xl font-medium text-stone-800 small:text-3xl medium:text-4xl"
      >
        {title}
      </h1>
      {meta ? (
        <p
          className={cn(
            "mt-2 max-w-2xl text-pretty text-sm text-stone-600 small:text-base",
            centered && "mx-auto"
          )}
        >
          {meta}
        </p>
      ) : null}
    </header>
  )
}
