import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum und rechtliche Informationen der Strickerei Jutta.",
}

export default function ImprintPage() {
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
            <span className="text-stone-800">Impressum</span>
          </nav>
        </div>
      </div>

      <div className="py-12 small:py-20">
        <div className="content-container">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-stone-200 p-8 small:p-12">
              <h1 className="font-serif text-3xl font-medium text-stone-800 mb-8">
                Impressum
              </h1>

            <div className="prose prose-stone max-w-none">
              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                Angaben gemäß § 5 ECG
              </h2>
              
              <div className="text-stone-600 mb-6">
                <p className="mb-2"><strong>Strickerei Jutta</strong></p>
                <p>Wiener Neustädterstraße 47</p>
                <p>7021 Draßburg</p>
                <p>Österreich</p>
              </div>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                Kontakt
              </h2>
              <div className="text-stone-600 mb-6">
                <p>Telefon: +43 2686 2259</p>
                <p>E-Mail: office@strickerei-jutta.at</p>
              </div>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                Unternehmensgegenstand
              </h2>
              <p className="text-stone-600 mb-6">
                Herstellung und Vertrieb von hochwertigen Strickwaren
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                Umsatzsteuer-Identifikationsnummer
              </h2>
              <p className="text-stone-600 mb-6">
                ATU12345678
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                Firmenbuchnummer
              </h2>
              <p className="text-stone-600 mb-6">
                FN 123456a<br />
                Landesgericht Eisenstadt
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                Berufsrecht
              </h2>
              <p className="text-stone-600 mb-6">
                Gewerbeordnung: www.ris.bka.gv.at<br />
                Mitglied der Wirtschaftskammer Burgenland
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                Streitschlichtung
              </h2>
              <p className="text-stone-600 mb-6">
                Die Europäische Kommission stellt eine Plattform zur 
                Online-Streitbeilegung (OS) bereit:<br />
                <a 
                  href="https://ec.europa.eu/consumers/odr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-stone-800 hover:underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
              <p className="text-stone-600 mb-6">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren 
                vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                Haftung für Inhalte
              </h2>
              <p className="text-stone-600 mb-6">
                Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten 
                nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht 
                verpflichtet, übermittelte oder gespeicherte fremde Informationen zu 
                überwachen.
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                Urheberrecht
              </h2>
              <p className="text-stone-600 mb-6">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen 
                Seiten unterliegen dem österreichischen Urheberrecht. Die Vervielfältigung, 
                Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen 
                des Urheberrechtes bedürfen der schriftlichen Zustimmung.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

