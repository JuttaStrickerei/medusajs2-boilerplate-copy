import { LOOKBOOK_SEASON } from "@modules/looks/lib/worlds"

type LooksIntroProps = {
  /** dient der Chip-Leiste als Merkpunkt „ganz oben“ */
  id: string
  count: number
  /** nach Farbwelten gegliedert (sonst ein neutrales Band) */
  isGrouped: boolean
}

export default function LooksIntro({ id, count, isGrouped }: LooksIntroProps) {
  return (
    <header
      id={id}
      className="content-container pb-4 pt-4 tablet:pb-6 tablet:pt-8 small:flex small:items-end small:justify-between small:gap-12 small:pb-8 small:pt-10"
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.15em] text-stone-500 tablet:text-xs">
          Shop the Look · {LOOKBOOK_SEASON}
        </p>
        <h1 className="mt-1.5 font-serif text-[2rem] font-normal leading-[2.25rem] text-stone-900 tablet:text-5xl tablet:leading-[1.05] medium:text-6xl">
          Looks in Farbe
        </h1>
      </div>
      {count > 0 && (
        <p className="mt-2 max-w-xl text-[15px] leading-[22px] text-stone-600 tablet:mt-3 tablet:text-base tablet:leading-[26px] small:mt-0 small:max-w-lg">
          {count} abgestimmte Outfits aus unserer Strickerei
          {isGrouped ? " – geordnet nach Farbwelten." : "."}
          <span className="hidden tablet:inline">
            {" "}
            Wählen Sie einmal Ihre Größe und bestellen Sie den ganzen Look –
            oder nur Ihre Lieblingsteile.
          </span>
        </p>
      )}
    </header>
  )
}
