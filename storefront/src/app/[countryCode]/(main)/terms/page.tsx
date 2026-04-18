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
                <p className="text-stone-600 mb-6">Stand: April 2026</p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  1. Geltungsbereich
                </h2>
                <p className="text-stone-600 mb-4">
                  Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge, die
                  zwischen der Strickerei Jutta, Ing. Jutta Strobl (nachfolgend „Verkäufer“ oder
                  „wir“) und Verbrauchern (§ 1 KSchG) (nachfolgend „Kunde“ oder „Sie“) über
                  diesen Online-Shop abgeschlossen werden.
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  2. Vertragspartner und Kundendienst
                </h2>
                <p className="text-stone-600 mb-4">
                  Der Kaufvertrag kommt zustande mit: Ing. Jutta Strobl; Wiener
                  Neustädterstraße 47, 7021 Draßburg, Österreich; Telefon: +43 2686 2259;
                  E-Mail:{" "}
                  <a
                    href="mailto:office@strickerei-jutta.at"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    office@strickerei-jutta.at
                  </a>
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  3. Angebot und Vertragsschluss
                </h2>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">3.1.</h3>
                <p className="text-stone-600 mb-4">
                  Die Präsentation der Produkte in unserem Online-Shop stellt kein rechtlich
                  bindendes Angebot, sondern eine unverbindliche Aufforderung zur Bestellung dar
                  (invitatio ad offerendum).
                </p>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">3.2.</h3>
                <p className="text-stone-600 mb-4">
                  Durch Anklicken des Buttons „Zahlungspflichtig bestellen“ (oder einer
                  gleichwertigen, eindeutigen Formulierung) geben Sie ein verbindliches Angebot
                  zum Kauf der im Warenkorb befindlichen Waren ab.
                </p>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">3.3.</h3>
                <p className="text-stone-600 mb-4">
                  Der Vertrag kommt zustande, wenn wir Ihre Bestellung durch eine
                  Auftragsbestätigung per E-Mail unmittelbar annehmen oder, bei Auswahl einer
                  sofortigen Online-Zahlungsmethode (z. B. PayPal, Kreditkarte,
                  Sofortüberweisung), bereits mit der von Ihnen angewiesenen
                  Zahlungsbestätigung.
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  4. Preise und Versandkosten
                </h2>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">4.1.</h3>
                <p className="text-stone-600 mb-4">
                  Die auf den Produktseiten genannten Preise sind Bruttopreise und enthalten die
                  gesetzliche Umsatzsteuer sowie sonstige Preisbestandteile.
                </p>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">4.2.</h3>
                <p className="text-stone-600 mb-4">
                  Zusätzlich zu den angegebenen Preisen berechnen wir für die Lieferung
                  Versandkosten. Die genauen Versandkosten werden Ihnen vor der Bezahlung deutlich
                  mitgeteilt.
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  5. Zahlung und Eigentumsvorbehalt
                </h2>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">5.1.</h3>
                <p className="text-stone-600 mb-4">
                  Ihnen stehen die im Bestellprozess angezeigten Zahlungsarten zur Verfügung.
                </p>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">5.2.</h3>
                <p className="text-stone-600 mb-4">
                  Die gelieferte Ware bleibt bis zur vollständigen Bezahlung des Kaufpreises
                  unser Eigentum.
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  6. Lieferbedingungen
                </h2>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">6.1.</h3>
                <p className="text-stone-600 mb-4">
                  Die Lieferung erfolgt an die vom Kunden angegebene Lieferadresse, sofern
                  nichts anderes vereinbart ist.
                </p>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">6.2.</h3>
                <p className="text-stone-600 mb-4">
                  Die voraussichtliche Lieferzeit wird direkt auf der Produktdetailseite oder im
                  Bestellprozess angegeben.
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  7. Widerrufsrecht (Rücktrittsrecht)
                </h2>
                <p className="text-stone-600 mb-4">
                  Verbrauchern steht bei Abschluss eines Fernabsatzgeschäfts grundsätzlich ein
                  gesetzliches Widerrufsrecht zu.
                </p>

                <h3 className="font-medium text-stone-800 mt-6 mb-2 text-base">
                  Widerrufsbelehrung
                </h3>
                <p className="text-stone-600 mb-4">
                  Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen
                  Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an
                  dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist,
                  die Waren in Besitz genommen haben bzw. hat. Um Ihr Widerrufsrecht
                  auszuüben, müssen Sie uns (Ing. Jutta Strobl, Wiener Neustädterstraße 47,
                  7021 Draßburg, Österreich;{" "}
                  <a
                    href="mailto:office@strickerei-jutta.at"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    office@strickerei-jutta.at
                  </a>
                  ) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter
                  Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen,
                  informieren. Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die
                  Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der
                  Widerrufsfrist absenden.
                </p>

                <h3 className="font-medium text-stone-800 mt-6 mb-2 text-base">
                  Folgen des Widerrufs
                </h3>
                <p className="text-stone-600 mb-4">
                  Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir
                  von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der
                  zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der
                  Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt
                  haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
                  zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei
                  uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe
                  Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es
                  sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart. Wir können
                  die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder
                  bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben,
                  je nachdem, welches der frühere Zeitpunkt ist. Sie haben die Waren
                  unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an
                  dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns
                  zurückzusenden oder zu übergeben. Sie tragen die unmittelbaren Kosten der
                  Rücksendung der Waren. Sie müssen für einen etwaigen Wertverlust der Waren
                  nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit,
                  Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen
                  zurückzuführen ist.
                </p>
                <p className="text-stone-600 mb-4">
                  <strong className="text-stone-800 font-medium">Ausnahme vom Widerrufsrecht:</strong>{" "}
                  Das Widerrufsrecht besteht nicht bei Verträgen zur Lieferung von Waren, die
                  nach Kundenspezifikation angefertigt werden oder eindeutig auf die
                  persönlichen Bedürfnisse zugeschnitten sind (z. B. individualisierte oder
                  personalisierte Maßanfertigungen).
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  8. Gewährleistung
                </h2>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">8.1.</h3>
                <p className="text-stone-600 mb-4">
                  Es gelten die gesetzlichen Gewährleistungsbestimmungen, insbesondere das
                  österreichische Verbrauchergewährleistungsgesetz (VGG).
                </p>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">8.2.</h3>
                <p className="text-stone-600 mb-4">
                  Wir haften dafür, dass die Ware zum Zeitpunkt der Übergabe mangelfrei ist. Die
                  Gewährleistungsfrist beträgt 2 Jahre ab Übergabe der Ware.
                </p>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">8.3.</h3>
                <p className="text-stone-600 mb-4">
                  Tritt ein Mangel innerhalb des ersten Jahres nach Übergabe auf, wird gesetzlich
                  vermutet, dass dieser bereits bei Übergabe bestand (Beweislastumkehr).
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  9. Haftung
                </h2>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">9.1.</h3>
                <p className="text-stone-600 mb-4">
                  Soweit dies gesetzlich zwingend vorgeschrieben ist, haften wir für
                  Personenschäden (Verletzung von Leben, Körper oder Gesundheit) sowie für
                  Schäden, die auf Vorsatz oder grober Fahrlässigkeit unsererseits beruhen, nach
                  den gesetzlichen Bestimmungen.
                </p>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">9.2.</h3>
                <p className="text-stone-600 mb-4">
                  Darüber hinaus ist unsere Haftung für Schäden, die lediglich auf leichter
                  Fahrlässigkeit beruhen, ausgeschlossen. Dieser Haftungsausschluss gilt jedoch
                  nicht für die Verletzung vertraglicher Hauptleistungspflichten
                  (Kardinalspflichten).
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  10. Streitschlichtung
                </h2>
                <p className="text-stone-600 mb-4">
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung
                  (OS) bereit, die Sie hier finden:{" "}
                  <a
                    href="https://ec.europa.eu/consumers/odr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600 break-all"
                  >
                    https://ec.europa.eu/consumers/odr/
                  </a>
                  . Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor
                  einer Verbraucherschlichtungsstelle teilzunehmen.
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  11. Schlussbestimmungen
                </h2>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">11.1.</h3>
                <p className="text-stone-600 mb-4">
                  Auf Verträge zwischen uns und Ihnen ist ausschließlich österreichisches Recht
                  unter Ausschluss der Verweisungsnormen des internationalen Privatrechts und
                  des UN-Kaufrechts anwendbar. Zwingende Verbraucherschutzbestimmungen des
                  Staates, in dem Sie Ihren gewöhnlichen Aufenthalt haben, bleiben hiervon
                  unberührt.
                </p>
                <h3 className="font-medium text-stone-800 mt-4 mb-2 text-base">11.2.</h3>
                <p className="text-stone-600 mb-4">
                  Vertragssprache ist Deutsch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
