import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Truck, RefreshCw, Package, Clock, Shield } from "@components/icons"

export const metadata: Metadata = {
  title: "Versand & Rückgabe",
  description:
    "Versand und Lieferzeit (ca. 2 Wochen innerhalb Österreichs) sowie Widerruf und Rückgabe bei Strickerei Jutta.",
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
              <div className="p-4 bg-stone-50 rounded-xl">
                <h3 className="font-medium text-stone-800 mb-2">Lieferung innerhalb Österreichs</h3>
                <p className="text-stone-600 text-sm">
                  Wir versenden per Post ausschließlich an Adressen in Österreich. Ein Versand ins Ausland ist nicht
                  möglich.
                </p>
              </div>

              <div className="border-t border-stone-200 pt-6">
                <div className="flex items-start gap-4">
                  <Clock size={20} className="text-stone-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-stone-800 mb-1">Lieferzeit</h3>
                    <p className="text-stone-600 text-sm">
                      Mit einer Lieferzeit von etwa{" "}
                      <span className="font-medium text-stone-700">2 Wochen</span> ab Versand Ihrer Bestellung können
                      Sie rechnen.
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
              Widerruf & Rückgabe
            </h2>

            <div className="space-y-6">
              <p className="text-stone-600">
                Sie können Ihren Vertrag binnen 14 Tagen ab Erhalt der Ware ohne Angabe von
                Gründen widerrufen (gesetzliches Widerrufsrecht). Bitte gehen Sie mit der Ware
                bis dahin sorgfältig um – für einen Wertverlust durch einen zur Prüfung nicht
                notwendigen Umgang müssen Sie aufkommen.
              </p>

              <div className="grid grid-cols-1 small:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <Package size={20} className="text-stone-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-stone-800 mb-1">So funktioniert's</h3>
                    <ol className="text-stone-600 text-sm space-y-1 list-decimal list-inside">
                      <li>Widerruf online über „Vertrag widerrufen“ oder per E-Mail erklären</li>
                      <li>Sie erhalten sofort eine Eingangsbestätigung per E-Mail</li>
                      <li>Verpacken Sie die Ware sicher</li>
                      <li>Senden Sie das Paket binnen 14 Tagen an uns zurück</li>
                    </ol>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield size={20} className="text-stone-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-stone-800 mb-1">Rückerstattung</h3>
                    <p className="text-stone-600 text-sm">
                      Sobald Ihr Widerruf bei uns eingegangen ist, erstatten wir den Kaufpreis
                      der widerrufenen Artikel spätestens binnen 14 Tagen auf Ihr ursprüngliches
                      Zahlungsmittel – wir können die Erstattung zurückhalten, bis die Ware bei
                      uns eingetroffen ist oder Sie die Rücksendung nachgewiesen haben. Die
                      Kosten der Rücksendung tragen Sie. Die Kosten der ursprünglichen
                      Standardlieferung erstatten wir nur, wenn Sie die gesamte Bestellung
                      widerrufen. Ist die Ware getragen, gewaschen oder beschädigt, ziehen wir
                      den dadurch entstandenen Wertverlust vom Erstattungsbetrag ab.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col small:flex-row small:items-center gap-4">
                <LocalizedClientLink
                  href="/vertrag-widerrufen"
                  className="text-sm text-stone-800 underline underline-offset-2 hover:text-stone-600"
                >
                  Zum Online-Widerruf
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/terms#widerrufsrecht"
                  className="text-sm text-stone-800 underline underline-offset-2 hover:text-stone-600"
                >
                  Zur vollständigen Widerrufsbelehrung
                </LocalizedClientLink>
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

