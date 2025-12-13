import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ChevronDown } from "@components/icons"

export const metadata: Metadata = {
  title: "Häufige Fragen (FAQ)",
  description: "Antworten auf häufig gestellte Fragen zu Strickerei Jutta Produkten, Bestellungen und mehr.",
}

const faqs = [
  {
    category: "Bestellung & Zahlung",
    questions: [
      {
        q: "Welche Zahlungsmethoden akzeptieren Sie?",
        a: "Wir akzeptieren Kreditkarten (Visa, Mastercard, American Express), PayPal, Klarna, eps-Überweisung und Vorkasse per Banküberweisung.",
      },
      {
        q: "Kann ich meine Bestellung ändern oder stornieren?",
        a: "Ja, solange Ihre Bestellung noch nicht versandt wurde. Kontaktieren Sie uns schnellstmöglich per E-Mail oder Telefon.",
      },
      {
        q: "Erhalte ich eine Bestellbestätigung?",
        a: "Ja, Sie erhalten sofort nach Ihrer Bestellung eine Bestätigung per E-Mail mit allen Details.",
      },
    ],
  },
  {
    category: "Versand & Lieferung",
    questions: [
      {
        q: "Wie lange dauert die Lieferung?",
        a: "Innerhalb Österreichs 2-4 Werktage, in die EU 4-7 Werktage, in die Schweiz 5-8 Werktage.",
      },
      {
        q: "Kann ich meine Sendung verfolgen?",
        a: "Ja, Sie erhalten eine Versandbestätigung mit Tracking-Nummer per E-Mail.",
      },
      {
        q: "Liefern Sie auch international?",
        a: "Ja, wir liefern in alle EU-Länder und die Schweiz. Für andere Länder kontaktieren Sie uns bitte.",
      },
    ],
  },
  {
    category: "Rückgabe & Umtausch",
    questions: [
      {
        q: "Wie lange habe ich Zeit für eine Rückgabe?",
        a: "Sie haben 30 Tage ab Erhalt der Ware Zeit für eine Rückgabe.",
      },
      {
        q: "Wer trägt die Kosten für die Rücksendung?",
        a: "Bei Rückgaben aus Österreich übernehmen wir die Kosten. Für andere Länder trägt der Kunde die Rücksendekosten.",
      },
      {
        q: "Wie erhalte ich mein Geld zurück?",
        a: "Nach Prüfung der Ware erstatten wir den Betrag innerhalb von 5-7 Werktagen auf Ihr ursprüngliches Zahlungsmittel.",
      },
    ],
  },
  {
    category: "Produkte & Pflege",
    questions: [
      {
        q: "Aus welchen Materialien bestehen Ihre Produkte?",
        a: "Wir verwenden ausschließlich hochwertige Naturfasern wie Merinowolle, Kaschmir, Alpaka und Bio-Baumwolle.",
      },
      {
        q: "Wie pflege ich meine Strickwaren richtig?",
        a: "Besuchen Sie unsere Pflegehinweise-Seite für detaillierte Anleitungen. Generell empfehlen wir Handwäsche oder Wollwaschgang bei max. 30°C.",
      },
      {
        q: "Sind Ihre Produkte nachhaltig?",
        a: "Ja, wir legen großen Wert auf Nachhaltigkeit: von der Auswahl der Materialien bis zur lokalen Produktion in Österreich.",
      },
    ],
  },
]

export default function FAQPage() {
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
            <span className="text-stone-800">Häufige Fragen</span>
          </nav>
        </div>
      </div>

      <div className="py-12 small:py-20">
        <div className="content-container">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <p className="text-stone-500 uppercase tracking-[0.15em] text-sm mb-2">
                Hilfe
              </p>
              <h1 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-4">
                Häufige Fragen
              </h1>
              <p className="text-stone-600">
                Hier finden Sie Antworten auf die am häufigsten gestellten Fragen.
              </p>
            </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {faqs.map((section, sectionIdx) => (
              <div key={sectionIdx} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <h2 className="font-serif text-lg font-medium text-stone-800 px-6 py-4 bg-stone-50 border-b border-stone-200">
                  {section.category}
                </h2>
                <div className="divide-y divide-stone-100">
                  {section.questions.map((faq, idx) => (
                    <details key={idx} className="group">
                      <summary className="px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-stone-50 transition-colors list-none">
                        <span className="font-medium text-stone-800 pr-4">{faq.q}</span>
                        <ChevronDown 
                          size={20} 
                          className="text-stone-400 flex-shrink-0 transition-transform group-open:rotate-180" 
                        />
                      </summary>
                      <div className="px-6 pb-4 text-stone-600 text-sm leading-relaxed">
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

            {/* Contact CTA */}
            <div className="mt-12 bg-stone-100 rounded-2xl p-8 text-center">
              <h3 className="font-medium text-stone-800 mb-2">Ihre Frage nicht dabei?</h3>
              <p className="text-stone-600 text-sm mb-4">
                Kontaktieren Sie uns unter{" "}
                <a href="mailto:info@strickerei-jutta.at" className="text-stone-800 hover:underline">
                  info@strickerei-jutta.at
                </a>
                {" "}oder{" "}
                <a href="tel:+4326862259" className="text-stone-800 hover:underline">
                  +43 2686 2259
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

