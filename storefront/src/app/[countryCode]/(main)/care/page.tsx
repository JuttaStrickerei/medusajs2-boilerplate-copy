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
            <div className="prose prose-stone max-w-none">
              <ul className="text-stone-600 space-y-3">
                <li>Waschen Sie Strickwaren nur wenn nötig - oft reicht Lüften an der frischen Luft</li>
                <li>Verwenden Sie immer ein spezielles Wollwaschmittel</li>
                <li>Niemals auswringen - sanft in ein Handtuch drücken</li>
                <li>Liegend trocknen, um die Form zu erhalten</li>
                <li>Nicht im direkten Sonnenlicht trocknen</li>
                <li>Bei Bedarf auf niedriger Stufe dämpfen, nicht bügeln</li>
              </ul>
            </div>
          </div>

          {/* Material Specific */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-8">
              <h3 className="font-medium text-stone-800 mb-4 text-lg">Merinowolle</h3>
              <div className="text-stone-600 text-sm space-y-2">
                <p><strong>Waschen:</strong> Handwäsche oder Wollwaschgang bei max. 30°C</p>
                <p><strong>Trocknen:</strong> Liegend trocknen, nicht im Trockner</p>
                <p><strong>Lagerung:</strong> Gefaltet lagern, nie aufhängen (Ausleiern)</p>
                <p><strong>Pilling:</strong> Leichtes Pilling ist normal, mit Wollkamm entfernen</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-8">
              <h3 className="font-medium text-stone-800 mb-4 text-lg">Kaschmir</h3>
              <div className="text-stone-600 text-sm space-y-2">
                <p><strong>Waschen:</strong> Handwäsche bei max. 30°C mit Kaschmirwaschmittel</p>
                <p><strong>Trocknen:</strong> Liegend auf einem Handtuch trocknen</p>
                <p><strong>Lagerung:</strong> In Seidenpapier einwickeln, mit Zedernholz gegen Motten</p>
                <p><strong>Besonderheit:</strong> Nach dem ersten Tragen 24h ruhen lassen</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-8">
              <h3 className="font-medium text-stone-800 mb-4 text-lg">Alpaka</h3>
              <div className="text-stone-600 text-sm space-y-2">
                <p><strong>Waschen:</strong> Handwäsche oder Wollwaschgang bei max. 30°C</p>
                <p><strong>Trocknen:</strong> Liegend trocknen, Form zurechtzupfen</p>
                <p><strong>Lagerung:</strong> Gefaltet und luftig lagern</p>
                <p><strong>Besonderheit:</strong> Alpaka ist von Natur aus geruchsresistent</p>
              </div>
            </div>
          </div>

            {/* Symbols */}
            <div className="mt-8 bg-stone-100 rounded-2xl p-8">
              <h3 className="font-medium text-stone-800 mb-4">Pflegesymbole</h3>
              <div className="grid grid-cols-2 small:grid-cols-4 gap-4 text-center text-sm">
                <div className="p-3 bg-white rounded-xl">
                  <div className="text-2xl mb-2">🧼</div>
                  <p className="text-stone-600">Handwäsche</p>
                </div>
                <div className="p-3 bg-white rounded-xl">
                  <div className="text-2xl mb-2">❄️</div>
                  <p className="text-stone-600">Kalt waschen</p>
                </div>
                <div className="p-3 bg-white rounded-xl">
                  <div className="text-2xl mb-2">🚫</div>
                  <p className="text-stone-600">Kein Trockner</p>
                </div>
                <div className="p-3 bg-white rounded-xl">
                  <div className="text-2xl mb-2">↔️</div>
                  <p className="text-stone-600">Liegend trocknen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

