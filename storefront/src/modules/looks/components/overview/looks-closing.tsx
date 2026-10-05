import { ArrowRight, RefreshCw } from "@components/icons"
import { cn } from "@lib/utils"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import styles from "./looks-overview.module.css"

const STEPS = [
  {
    title: "Look wählen",
    text: "Alle Teile eines Looks sind farblich aufeinander abgestimmt.",
  },
  {
    title: "Größe einmal wählen",
    text: "Ihre Größe gilt für alle Teile – einzeln anpassen können Sie trotzdem.",
  },
  {
    title: "Ganz oder einzeln",
    text: "Legen Sie den ganzen Look in den Warenkorb – oder nur Ihre Lieblingsteile.",
  },
]

/** Abschluss „So bestellen Sie einen Look“ samt Wegen zu den Einzelteilen */
export default function LooksClosing() {
  return (
    <section
      aria-labelledby="bestellen-title"
      className="bg-stone-50 py-12 small:py-20"
    >
      <div className={cn("content-container", styles.reveal)}>
        <h2
          id="bestellen-title"
          className="font-serif text-2xl font-normal text-stone-900 small:text-3xl"
        >
          So bestellen Sie einen Look
        </h2>
        <ol className="mt-6 grid gap-5 tablet:grid-cols-3 tablet:gap-8">
          {STEPS.map((step) => (
            <li key={step.title} className="border-t border-stone-300 pt-4">
              <p className="font-serif text-lg text-stone-900">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col gap-3 border-t border-stone-200 pt-6 text-sm text-stone-600 tablet:flex-row tablet:flex-wrap tablet:items-center tablet:gap-x-8">
          <p className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:gap-4">
            <span className="text-stone-900">Lieber einzelne Teile?</span>
            {/* Link im Stil des Sekundär-Buttons (kein <button> im <a>) */}
            <LocalizedClientLink
              href="/store"
              className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg border border-stone-300 px-4 font-medium text-stone-800 transition-colors hover:border-stone-400 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              Alle Produkte ansehen
              <ArrowRight size={16} aria-hidden />
            </LocalizedClientLink>
          </p>
          <LocalizedClientLink
            href="/size-guide"
            className="inline-flex min-h-11 items-center self-start underline underline-offset-4 hover:text-stone-900 tablet:self-auto"
          >
            Unsicher bei der Größe? Zur Größentabelle
          </LocalizedClientLink>
          <p className="flex items-center gap-2">
            <RefreshCw
              size={14}
              aria-hidden
              className="shrink-0 text-stone-400"
            />
            Passt nicht? Wir tauschen unkompliziert.
          </p>
        </div>
      </div>
    </section>
  )
}
