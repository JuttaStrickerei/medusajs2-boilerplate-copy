import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Truck, RefreshCw, Package, Clock, Shield } from "@components/icons"

export const metadata: Metadata = {
  title: "Versand & Rückgabe",
  description: "Informationen zu Versand, Lieferung und Rückgabe bei Strickerei Jutta.",
}

export default function ShippingPage() {
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
            <span className="text-stone-800">Versand & Rückgabe</span>
          </nav>
        </div>
      </div>

      <div className="py-12 small:py-20">
        <div className="content-container">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <p className="text-stone-500 uppercase tracking-[0.15em] text-sm mb-2">
                Service
              </p>
              <h1 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-4">
                Versand & Rückgabe
              </h1>
              <p className="text-stone-600 max-w-xl mx-auto">
                Wir möchten, dass Sie mit Ihrem Einkauf vollkommen zufrieden sind.
              </p>
            </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-2xl border border-stone-200 p-8 mb-8">
            <h2 className="font-serif text-xl font-medium text-stone-800 mb-6 flex items-center gap-3">
              <Truck size={24} />
              Versand
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 small:grid-cols-2 gap-6">
                <div className="p-4 bg-stone-50 rounded-xl">
                  <h3 className="font-medium text-stone-800 mb-2">Österreich</h3>
                  <p className="text-stone-600 text-sm mb-2">Versandkosten: € 4,90</p>
                  <p className="text-stone-600 text-sm">Ab € 75,00 versandkostenfrei</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-xl">
                  <h3 className="font-medium text-stone-800 mb-2">EU & Schweiz</h3>
                  <p className="text-stone-600 text-sm mb-2">Versandkosten: € 9,90</p>
                  <p className="text-stone-600 text-sm">Ab € 150,00 versandkostenfrei</p>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-6">
                <div className="flex items-start gap-4">
                  <Clock size={20} className="text-stone-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-stone-800 mb-1">Lieferzeit</h3>
                    <p className="text-stone-600 text-sm">
                      Innerhalb Österreichs: 2-4 Werktage<br />
                      EU: 4-7 Werktage<br />
                      Schweiz: 5-8 Werktage
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Returns Info */}
          <div className="bg-white rounded-2xl border border-stone-200 p-8 mb-8">
            <h2 className="font-serif text-xl font-medium text-stone-800 mb-6 flex items-center gap-3">
              <RefreshCw size={24} />
              Rückgabe & Umtausch
            </h2>

            <div className="space-y-6">
              <p className="text-stone-600">
                Sie haben 30 Tage Zeit, Ihre Bestellung zurückzusenden oder umzutauschen. 
                Die Artikel müssen ungetragen, ungewaschen und mit allen Etiketten versehen sein.
              </p>

              <div className="grid grid-cols-1 small:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <Package size={20} className="text-stone-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-stone-800 mb-1">So funktioniert's</h3>
                    <ol className="text-stone-600 text-sm space-y-1 list-decimal list-inside">
                      <li>Kontaktieren Sie unseren Kundenservice</li>
                      <li>Sie erhalten ein Rücksendeetikett</li>
                      <li>Verpacken Sie die Ware sicher</li>
                      <li>Geben Sie das Paket bei der Post ab</li>
                    </ol>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield size={20} className="text-stone-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-stone-800 mb-1">Rückerstattung</h3>
                    <p className="text-stone-600 text-sm">
                      Nach Erhalt und Prüfung der Ware erstatten wir den Kaufpreis 
                      innerhalb von 5-7 Werktagen auf Ihr ursprüngliches Zahlungsmittel.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* FAQ */}
            <div className="bg-stone-100 rounded-2xl p-8 text-center">
              <h3 className="font-medium text-stone-800 mb-2">Noch Fragen?</h3>
              <p className="text-stone-600 text-sm mb-4">
                Kontaktieren Sie uns unter{" "}
                <a href="mailto:office@strickerei-jutta.at" className="text-stone-800 hover:underline">
                  office@strickerei-jutta.at
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

