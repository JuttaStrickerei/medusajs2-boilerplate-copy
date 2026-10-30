import { Metadata } from "next"
import Image from "next/image"
import PageBreadcrumb from "@modules/common/components/page-breadcrumb"
import PageHeader from "@modules/common/components/page-header"
import { Ruler } from "@components/icons"

export const metadata: Metadata = {
  title: "Größenberatung",
  description:
    "Finden Sie Ihre perfekte Größe mit unserer Maßtabelle und Messanleitung.",
}

/** Dieselben Bezeichnungen wie die Größen-Auswahl auf der Produktseite */
const sizeColumns = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const

/**
 * Was nur Jutta weiß. Solange ein Wert null ist, zeigt die Seite lokal einen
 * gelben Platzhalter; im Live-Betrieb fällt der Satz einfach weg.
 */
const juttaAngaben = {
  // Zeigt die Tabelle Körpermaße oder die Maße des fertigen Stücks?
  tabelleZeigt: null as "koerper" | "stueck" | null,
  // Zwischen zwei Größen: zur kleineren oder zur größeren?
  zwischenZweiGroessen: null as "kleiner" | "groesser" | null,
  // Ein Satz, wie die Stücke ausfallen, z. B. "Unsere Stücke fallen …"
  passform: null as string | null,
  // Ein Satz zu den Zahlengrößen, z. B. "Größe 36 entspricht …"
  zahlengroessen: null as string | null,
}

const tabelleZeigtText = {
  koerper:
    "Messen Sie sich wie unten gezeigt und wählen Sie die Größe, die zu Ihrem Brustumfang passt.",
  stueck:
    "Die Tabelle zeigt die Maße des fertigen Stücks. Vergleichen Sie sie am besten mit einem Stück, das Ihnen gut passt.",
}

const zwischenZweiGroessenText = {
  kleiner: "Liegen Sie zwischen zwei Größen, nehmen Sie die kleinere.",
  groesser: "Liegen Sie zwischen zwei Größen, nehmen Sie die größere.",
}

function OffenFuerJutta({ frage }: { frage: string }) {
  if (process.env.NODE_ENV === "production") return null
  return (
    <span className="inline-block rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">
      Offen für Jutta: {frage}
    </span>
  )
}

const measureRows: { label: string; values: string[] }[] = [
  {
    label: "A – Brustumfang (cm)",
    values: ["100", "106", "110", "116", "122", "128", "132"],
  },
  {
    label: "B – Hüftumfang (cm)",
    values: ["106", "112", "116", "122", "128", "132", "136"],
  },
  {
    label: "C – Armlänge (cm)",
    values: ["58", "58", "58", "58", "58", "58", "58"],
  },
  {
    label: "D – Innere Beinlänge (cm)",
    values: ["68", "68", "70", "72", "72", "72", "72"],
  },
]

export default function SizeGuidePage() {
  return (
    <div className="bg-stone-50">
      <PageBreadcrumb items={[{ label: "Größenberatung" }]} />
      <PageHeader
        centered
        title="Größenberatung"
        meta="Finden Sie Ihre perfekte Größe mit unserer Maßtabelle und Messanleitung."
      />

      <div className="pb-12 small:pb-20">
        <div className="content-container">
          <div className="max-w-4xl mx-auto">
            {/* Die eine Empfehlung */}
            <div className="bg-stone-100 rounded-2xl p-8 mb-8">
              <h2 className="font-serif text-xl font-medium text-stone-800 mb-4">
                Unsere Empfehlung
              </h2>
              <div className="text-stone-600 space-y-3">
                {juttaAngaben.tabelleZeigt ? (
                  <p>{tabelleZeigtText[juttaAngaben.tabelleZeigt]}</p>
                ) : (
                  <OffenFuerJutta frage="Zeigt die Tabelle Körpermaße oder die Maße des fertigen Stücks?" />
                )}
                {juttaAngaben.zwischenZweiGroessen ? (
                  <p>
                    {zwischenZweiGroessenText[juttaAngaben.zwischenZweiGroessen]}
                  </p>
                ) : (
                  <OffenFuerJutta frage="Zwischen zwei Größen: zur kleineren oder zur größeren?" />
                )}
                {juttaAngaben.passform ? (
                  <p>{juttaAngaben.passform}</p>
                ) : (
                  <OffenFuerJutta frage="Wie fallen die Stücke aus (normal, weit, je nach Stück)?" />
                )}
                {juttaAngaben.zahlengroessen ? (
                  <p>{juttaAngaben.zahlengroessen}</p>
                ) : (
                  <OffenFuerJutta frage="Welche Zahlengröße entspricht welcher Buchstabengröße (Jacke FLOKA: 36, 42, 46)?" />
                )}
                <p>
                  Sie sind unsicher? Rufen Sie uns an unter{" "}
                  <a
                    href="tel:+4326862259"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    +43 2686 2259
                  </a>{" "}
                  oder schreiben Sie an{" "}
                  <a
                    href="mailto:office@strickerei-jutta.at"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    office@strickerei-jutta.at
                  </a>
                  . Wir beraten Sie gerne persönlich.
                </p>
              </div>
            </div>

            {/* Messanleitung – Bild */}
            <div className="bg-white rounded-2xl border border-stone-200 p-8 mb-8">
              <h2 className="font-serif text-xl font-medium text-stone-800 mb-6 flex items-center gap-3">
                <Ruler size={24} />
                So messen Sie richtig
              </h2>
              <div className="relative w-full max-w-xl mx-auto aspect-[550/780]">
                <Image
                  src="/images/size-guide/maßtabelle_damen.webp"
                  alt="Messanleitung: A Brustumfang, B Hüftumfang, C Armlänge, D innere Beinlänge"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 550px"
                  priority
                />
              </div>
            </div>

            {/* Maßtabelle */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-8">
              <h2 className="font-serif text-lg font-medium text-stone-800 px-6 py-4 bg-stone-50 border-b border-stone-200">
                Maßtabelle
                {juttaAngaben.tabelleZeigt === "koerper" && " (Körpermaße)"}
                {juttaAngaben.tabelleZeigt === "stueck" &&
                  " (Maße des fertigen Stücks)"}
              </h2>
              <div className="px-6 pt-4 empty:hidden">
                {/* Entfernen, sobald Jutta die Werte bestätigt hat */}
                <OffenFuerJutta frage="Stimmen diese Werte, und gelten sie für alle Stücke (Mantel, Pullover, Hose)?" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-stone-50">
                    <tr className="border-b border-stone-200">
                      <th className="border border-stone-200 px-4 py-3 text-left font-medium text-stone-800 align-middle bg-stone-50">
                        Größe
                      </th>
                      {sizeColumns.map((s) => (
                        <th
                          key={s}
                          className="border border-stone-200 px-3 py-2 text-center font-medium text-stone-800"
                        >
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {measureRows.map((row) => (
                      <tr key={row.label}>
                        <th className="border border-stone-200 px-4 py-3 text-left font-medium text-stone-800 bg-white">
                          {row.label}
                        </th>
                        {row.values.map((cell, i) => (
                          <td
                            key={`${row.label}-${i}`}
                            className="border border-stone-200 px-3 py-3 text-center text-stone-600 tabular-nums"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
