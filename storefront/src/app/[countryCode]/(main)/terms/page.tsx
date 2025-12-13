import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen",
  description: "AGB der Strickerei Jutta für Online-Bestellungen.",
}

export default function TermsPage() {
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
            <span className="text-stone-800">AGB</span>
          </nav>
        </div>
      </div>

      <div className="py-12 small:py-20">
        <div className="content-container">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-stone-200 p-8 small:p-12">
              <h1 className="font-serif text-3xl font-medium text-stone-800 mb-8">
                Allgemeine Geschäftsbedingungen
              </h1>

            <div className="prose prose-stone max-w-none">
              <p className="text-stone-600 mb-6">
                Stand: Dezember 2024
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                §1 Geltungsbereich
              </h2>
              <p className="text-stone-600 mb-4">
                Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge, die über 
                unseren Online-Shop geschlossen werden. Vertragspartner ist die Strickerei 
                Jutta, Hauptstraße 1, 7021 Draßburg, Österreich.
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                §2 Vertragsschluss
              </h2>
              <p className="text-stone-600 mb-4">
                Die Präsentation der Waren im Online-Shop stellt kein rechtlich bindendes 
                Angebot dar. Mit Ihrer Bestellung geben Sie ein verbindliches Angebot ab. 
                Der Vertrag kommt zustande, wenn wir Ihre Bestellung durch eine 
                Auftragsbestätigung annehmen.
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                §3 Preise und Zahlung
              </h2>
              <p className="text-stone-600 mb-4">
                Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer. 
                Zusätzlich anfallende Versandkosten werden im Bestellvorgang gesondert ausgewiesen.
              </p>
              <p className="text-stone-600 mb-4">
                Zahlungsmöglichkeiten: Kreditkarte, PayPal, Klarna, eps-Überweisung, Vorkasse.
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                §4 Lieferung
              </h2>
              <p className="text-stone-600 mb-4">
                Die Lieferung erfolgt an die von Ihnen angegebene Lieferadresse. 
                Lieferzeiten werden während des Bestellvorgangs angegeben und sind 
                unverbindlich, sofern nicht ausdrücklich als verbindlich bezeichnet.
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                §5 Widerrufsrecht
              </h2>
              <p className="text-stone-600 mb-4">
                Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen 
                Vertrag zu widerrufen. Zur Wahrung der Widerrufsfrist reicht es aus, 
                dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf 
                der Frist absenden.
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                §6 Gewährleistung
              </h2>
              <p className="text-stone-600 mb-4">
                Es gelten die gesetzlichen Gewährleistungsrechte. Bei Mängeln haben Sie 
                Anspruch auf Nacherfüllung durch Nachbesserung oder Ersatzlieferung.
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                §7 Eigentumsvorbehalt
              </h2>
              <p className="text-stone-600 mb-4">
                Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                §8 Streitbeilegung
              </h2>
              <p className="text-stone-600 mb-4">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung 
                (OS) bereit: https://ec.europa.eu/consumers/odr
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                §9 Schlussbestimmungen
              </h2>
              <p className="text-stone-600 mb-4">
                Es gilt österreichisches Recht. Gerichtsstand ist, soweit gesetzlich 
                zulässig, unser Geschäftssitz.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

