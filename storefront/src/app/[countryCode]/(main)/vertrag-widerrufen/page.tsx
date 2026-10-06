import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PageBreadcrumb from "@modules/common/components/page-breadcrumb"
import RevocationForm from "@modules/revocation/components/revocation-form"

export const metadata: Metadata = {
  title: "Vertrag widerrufen",
  description:
    "Widerrufen Sie Ihren Vertrag mit Strickerei Jutta online – ohne Anmeldung, mit sofortiger Eingangsbestätigung per E-Mail.",
}

export default function RevocationPage() {
  return (
    <div className="bg-stone-50">
      <PageBreadcrumb items={[{ label: "Vertrag widerrufen" }]} />

      <div className="content-container py-12 small:py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          <header>
            <h1 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-4">
              Vertrag widerrufen
            </h1>
            <div className="space-y-3 text-stone-700">
              <p>
                Als Verbraucherin bzw. Verbraucher können Sie einen bei uns
                geschlossenen Vertrag binnen 14 Tagen ab Erhalt der Ware ohne
                Angabe von Gründen widerrufen. Hier können Sie Ihren Widerruf
                online erklären – eine Anmeldung ist dafür nicht nötig.
              </p>
              <p>
                Nach dem Absenden erhalten Sie sofort eine Eingangsbestätigung
                per E-Mail mit dem Inhalt Ihrer Erklärung sowie Datum und
                Uhrzeit des Eingangs. Details finden Sie in unserer{" "}
                <LocalizedClientLink
                  href="/terms#widerrufsrecht"
                  className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                >
                  Widerrufsbelehrung
                </LocalizedClientLink>
                .
              </p>
            </div>
          </header>

          <section
            aria-label="Widerrufsformular"
            className="relative bg-white rounded-2xl border border-stone-200 p-6 small:p-10"
          >
            <RevocationForm />
          </section>

          <section
            aria-labelledby="muster-heading"
            className="bg-white rounded-2xl border border-stone-200 p-6 small:p-10"
          >
            <h2
              id="muster-heading"
              className="font-serif text-2xl font-medium text-stone-800 mb-3"
            >
              Alternativ: Muster-Widerrufsformular
            </h2>
            <p className="text-stone-700 mb-4">
              Sie können Ihren Widerruf auch per Post oder E-Mail an{" "}
              <a
                href="mailto:office@strickerei-jutta.at"
                className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
              >
                office@strickerei-jutta.at
              </a>{" "}
              erklären, zum Beispiel mit dem folgenden Muster-Widerrufsformular.
              Die Verwendung des Formulars ist nicht vorgeschrieben.
            </p>
            <a
              href="/muster-widerrufsformular.pdf"
              download
              className="inline-flex items-center min-h-[44px] px-5 py-2.5 rounded-lg border-2 border-stone-800 text-stone-800 font-medium hover:bg-stone-100 mb-6"
            >
              Muster-Widerrufsformular herunterladen (PDF)
            </a>
            <div className="border-l-4 border-stone-300 pl-4 text-stone-700 space-y-2 text-sm">
              <p className="font-medium text-stone-800">
                Muster-Widerrufsformular
              </p>
              <p>
                (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte
                dieses Formular aus und senden Sie es zurück.)
              </p>
              <ul className="space-y-2">
                <li>
                  – An Ing. Jutta Strobl, Wiener Neustädterstraße 47, 7021
                  Draßburg, Österreich, E-Mail: office@strickerei-jutta.at:
                </li>
                <li>
                  – Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*)
                  abgeschlossenen Vertrag über den Kauf der folgenden Waren
                  (*)/die Erbringung der folgenden Dienstleistung (*)
                </li>
                <li>– Bestellt am (*)/erhalten am (*)</li>
                <li>– Name des/der Verbraucher(s)</li>
                <li>– Anschrift des/der Verbraucher(s)</li>
                <li>
                  – Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf
                  Papier)
                </li>
                <li>– Datum</li>
              </ul>
              <p>(*) Unzutreffendes streichen.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
