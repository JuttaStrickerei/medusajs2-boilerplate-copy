import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Datenschutzerklärung der Strickerei Jutta gemäß DSGVO.",
}

export default function PrivacyPage() {
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
            <span className="text-stone-800">Datenschutz</span>
          </nav>
        </div>
      </div>

      <div className="py-12 small:py-20">
        <div className="content-container">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-stone-200 p-8 small:p-12">
              <h1 className="font-serif text-3xl font-medium text-stone-800 mb-8">
                Datenschutzerklärung
              </h1>

            <div className="prose prose-stone max-w-none">
              <p className="text-stone-600 mb-6">
                Stand: Dezember 2024
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                1. Verantwortlicher
              </h2>
              <p className="text-stone-600 mb-4">
                Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
                Strickerei Jutta<br />
                Wiener Neustädterstraße 47<br />
                7021 Draßburg, Österreich<br />
                E-Mail: office@strickerei-jutta.at
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                2. Erhebung und Verarbeitung von Daten
              </h2>
              <p className="text-stone-600 mb-4">
                Wir erheben personenbezogene Daten nur, wenn Sie uns diese im Rahmen 
                einer Bestellung, bei der Registrierung für ein Kundenkonto oder bei 
                einer Kontaktaufnahme freiwillig mitteilen.
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                3. Verwendungszweck
              </h2>
              <p className="text-stone-600 mb-4">
                Ihre personenbezogenen Daten werden ausschließlich verwendet für:
              </p>
              <ul className="text-stone-600 mb-4 list-disc pl-6">
                <li>Die Abwicklung Ihrer Bestellung</li>
                <li>Die Kommunikation mit Ihnen</li>
                <li>Den Versand von Newslettern (nur mit Ihrer Einwilligung)</li>
                <li>Die Verbesserung unseres Angebots</li>
              </ul>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                4. Cookies
              </h2>
              <p className="text-stone-600 mb-4">
                Unsere Website verwendet Cookies. Dabei handelt es sich um kleine 
                Textdateien, die auf Ihrem Endgerät gespeichert werden. Sie können 
                Ihre Browser-Einstellungen so anpassen, dass Cookies nicht akzeptiert werden.
              </p>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                5. Ihre Rechte
              </h2>
              <p className="text-stone-600 mb-4">
                Nach der DSGVO haben Sie folgende Rechte:
              </p>
              <ul className="text-stone-600 mb-4 list-disc pl-6">
                <li>Recht auf Auskunft über Ihre gespeicherten Daten</li>
                <li>Recht auf Berichtigung unrichtiger Daten</li>
                <li>Recht auf Löschung Ihrer Daten</li>
                <li>Recht auf Einschränkung der Verarbeitung</li>
                <li>Recht auf Datenübertragbarkeit</li>
                <li>Widerspruchsrecht</li>
              </ul>

              <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                6. Kontakt
              </h2>
              <p className="text-stone-600 mb-4">
                Bei Fragen zum Datenschutz kontaktieren Sie uns unter:<br />
                E-Mail: office@strickerei-jutta.at<br />
                Telefon: +43 2686 2259
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

