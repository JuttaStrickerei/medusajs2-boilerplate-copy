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
                <p>
                  Legen Sie ein Stück, das Ihnen gut passt, flach hin. Messen Sie
                  die Breite auf Brusthöhe und nehmen Sie den Wert mal zwei: Das
                  ist der Brustumfang. Wählen Sie die Größe, deren Wert in der
                  Tabelle am nächsten liegt.
                </p>
                <p>
                  Liegen Sie zwischen zwei Größen, nehmen Sie bei Strick die
                  kleinere, denn Strick gibt leicht nach. Mögen Sie es locker,
                  nehmen Sie die größere.
                </p>
                <p>
                  Wie weit ein Stück geschnitten ist, lesen Sie in seiner
                  Beschreibung. Die Maße sind Richtwerte und können je nach
                  Schnitt etwas abweichen.
                </p>
                <p>
                  Für Stücke mit Zahlengrößen wie die Jacke FLOKA und bei allen
                  anderen Fragen rufen Sie uns an unter{" "}
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
              <h2 className="font-serif text-xl font-medium text-stone-800 mb-3 flex items-center gap-3">
                <Ruler size={24} />
                Wo gemessen wird
              </h2>
              <p className="text-stone-600 mb-6">
                Die Buchstaben zeigen, welches Maß in der Tabelle gemeint ist. Die
                Tabelle nennt die Maße des fertigen Stücks, nicht Ihre Körpermaße.
              </p>
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
                Maßtabelle (Maße des fertigen Stücks)
              </h2>
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
