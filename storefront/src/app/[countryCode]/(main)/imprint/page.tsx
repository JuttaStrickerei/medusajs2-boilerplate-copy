import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Impressum",
  description:
    "Impressum und Offenlegung gem. MedienG, ECG und GewO – Strickerei Jutta, Ing. Jutta Strobl.",
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
              <h1 className="font-serif text-3xl font-medium text-stone-800 mb-4">
                Impressum
              </h1>
              <p className="text-stone-600 text-base mb-8 leading-relaxed">
                Impressum und Offenlegung gem. §§ 24, 25 MedienG sowie Angaben gem. § 5 ECG und § 63
                GewO
              </p>

              <div className="prose prose-stone max-w-none">
                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4 first:mt-0">
                  Medieninhaber und Herausgeber
                </h2>
                <address className="text-stone-600 not-italic mb-6">
                  Ing. Jutta Strobl
                  <br />
                  Wiener Neustädterstraße 47
                  <br />
                  7021 Draßburg
                  <br />
                  Österreich
                </address>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">Kontakt</h2>
                <p className="text-stone-600 mb-6">
                  Telefon:{" "}
                  <a
                    href="tel:+4326862259"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    +43 2686 2259
                  </a>
                  <br />
                  E-Mail:{" "}
                  <a
                    href="mailto:office@strickerei-jutta.at"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    office@strickerei-jutta.at
                  </a>
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  Unternehmensdaten
                </h2>
                <dl className="text-stone-600 mb-6 space-y-3">
                  <div>
                    <dt className="font-medium text-stone-800">Unternehmensgegenstand</dt>
                    <dd className="mt-1">
                      Herstellung und Vertrieb von Strickwaren
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-stone-800">Gewerbewortlaut</dt>
                    <dd className="mt-1">
                      Maschinenstricker und Wirker gem. § 94 Ziffer 46 GewO 1973 i.d.g.F.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-stone-800">GISA-Zahl</dt>
                    <dd className="mt-1">10244944</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-stone-800">
                      Umsatzsteuer-Identifikationsnummer (UID)
                    </dt>
                    <dd className="mt-1">ATU 20913304</dd>
                  </div>
                </dl>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  Aufsichtsbehörde und Berufsrecht
                </h2>
                <p className="text-stone-600 mb-4">
                  <strong className="text-stone-800 font-medium">
                    Zuständige Aufsichtsbehörde/Gewerbebehörde:
                  </strong>{" "}
                  Bezirkshauptmannschaft Mattersburg
                </p>
                <p className="text-stone-600 mb-4">
                  <strong className="text-stone-800 font-medium">Kammerzugehörigkeit:</strong>{" "}
                  Mitglied der Wirtschaftskammer Burgenland
                </p>
                <p className="text-stone-600 mb-6">
                  <strong className="text-stone-800 font-medium">Anwendbare Rechtsvorschriften:</strong>{" "}
                  Gewerbeordnung 1994 (jederzeit abrufbar unter:{" "}
                  <a
                    href="https://www.ris.bka.gv.at"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    www.ris.bka.gv.at
                  </a>
                  )
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  Streitschlichtung
                </h2>
                <p className="text-stone-600 mb-6">
                  Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                  Verbraucherschlichtungsstelle teilzunehmen.
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  Haftung für Inhalte
                </h2>
                <p className="text-stone-600 mb-6">
                  Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den
                  allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet,
                  übermittelte oder gespeicherte fremde Informationen zu überwachen.
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  Urheberrecht
                </h2>
                <p className="text-stone-600 mb-0">
                  Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
                  unterliegen dem österreichischen Urheberrecht. Die Vervielfältigung, Bearbeitung,
                  Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
                  bedürfen der schriftlichen Zustimmung.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
