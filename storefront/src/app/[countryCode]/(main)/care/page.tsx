import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Pflegehinweise",
  description: "Erfahren Sie, wie Sie Ihre Strickwaren von Strickerei Jutta richtig pflegen.",
}

export default function CarePage() {
  return (
    <div className="bg-stone-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="content-container py-3">
          <nav className="flex text-sm text-stone-500">
            <LocalizedClientLink href="/" className="hover:text-stone-800 transition-colors">
              Home
            </LocalizedClientLink>
            <span className="mx-2">/</span>
            <span className="text-stone-800">Pflegehinweise</span>
          </nav>
        </div>
      </div>

      <div className="py-12 small:py-20">
        <div className="content-container">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <p className="text-stone-500 uppercase tracking-[0.15em] text-sm mb-2">
                Pflege
              </p>
              <h1 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-4">
                Pflegehinweise
              </h1>
              <p className="text-stone-600 max-w-xl mx-auto">
                Mit der richtigen Pflege begleiten Sie unsere Strickwaren ein Leben lang.
              </p>
            </div>

          {/* General Care */}
          <div className="bg-white rounded-2xl border border-stone-200 p-8 mb-8">
            <h2 className="font-serif text-xl font-medium text-stone-800 mb-6">
              Allgemeine Pflegetipps
            </h2>
            <ul className="text-stone-600 text-sm leading-relaxed space-y-3 list-disc pl-5 marker:text-stone-400">
              <li>Waschen Sie Strickwaren nur wenn nötig – oft reicht Lüften an der frischen Luft</li>
              <li>Verwenden Sie immer ein spezielles Wollwaschmittel</li>
              <li>Niemals auswringen – sanft in ein Handtuch drücken</li>
              <li>Liegend trocknen, um die Form zu erhalten</li>
              <li>Nicht im direkten Sonnenlicht trocknen</li>
              <li>Bei Bedarf auf niedriger Stufe dämpfen, nicht bügeln</li>
            </ul>
          </div>

          {/* Material Specific */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-8">
              <h2 className="font-serif text-xl font-medium text-stone-800 mb-6">
                Merinowolle
              </h2>
              <div className="text-stone-600 text-sm leading-relaxed space-y-3">
                <p>
                  <span className="font-medium text-stone-700">Waschen:</span>{" "}
                  Handwäsche oder Wollwaschgang bei max. 30&nbsp;°C
                </p>
                <p>
                  <span className="font-medium text-stone-700">Trocknen:</span>{" "}
                  Liegend trocknen, nicht im Trockner
                </p>
                <p>
                  <span className="font-medium text-stone-700">Lagerung:</span>{" "}
                  Gefaltet lagern, nie aufhängen (Ausleiern)
                </p>
                <p>
                  <span className="font-medium text-stone-700">Pilling:</span>{" "}
                  Leichtes Pilling ist normal, mit Wollkamm entfernen
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-8">
              <h2 className="font-serif text-xl font-medium text-stone-800 mb-6">
                Kaschmir
              </h2>
              <div className="text-stone-600 text-sm leading-relaxed space-y-3">
                <p>
                  <span className="font-medium text-stone-700">Waschen:</span>{" "}
                  Handwäsche bei max. 30&nbsp;°C mit Kaschmirwaschmittel
                </p>
                <p>
                  <span className="font-medium text-stone-700">Trocknen:</span>{" "}
                  Liegend auf einem Handtuch trocknen
                </p>
                <p>
                  <span className="font-medium text-stone-700">Lagerung:</span>{" "}
                  In Seidenpapier einwickeln, mit Zedernholz gegen Motten
                </p>
                <p>
                  <span className="font-medium text-stone-700">Besonderheit:</span>{" "}
                  Nach dem ersten Tragen 24&nbsp;h ruhen lassen
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

