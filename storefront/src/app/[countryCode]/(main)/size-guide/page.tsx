import { Metadata } from "next"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Ruler } from "@components/icons"

export const metadata: Metadata = {
  title: "Größenberatung",
  description: "Finden Sie Ihre perfekte Größe mit unserer Maßtabelle und Messanleitung.",
}

/** Unter der zweiten Kopfzeile nur XS–XXL; 3XL sitzt im ersten Kopf mit rowSpan. */
const sizeSubColumns = ["XS", "S", "M", "L", "XL", "XXL"] as const

const measureRows: { label: string; values: string[] }[] = [
  {
    label: "A1 – Brustumfang (cm)",
    values: ["78-82", "83-87", "88-92", "93-97", "98-103", "104-109", "110-115"],
  },
  {
    label: "A2 – Unterbrustumfang (cm)",
    values: ["63-67", "68-72", "73-77", "78-82", "83-87", "88-92", "93-97"],
  },
  {
    label: "B – Taillenumfang (cm)",
    values: ["64-68", "69-73", "74-78", "79-83", "84-90", "91-97", "98-104"],
  },
  {
    label: "C – Hüftumfang (cm)",
    values: ["87-91", "92-96", "97-101", "102-106", "107-111", "112-117", "118-122"],
  },
  {
    label: "D – Armlänge (cm)",
    values: [
      "59-60",
      "59-60",
      "59-60",
      "60,5-61,5",
      "60,5-61,5",
      "62-63",
      "62-63",
    ],
  },
  {
    label: "E – Innere Beinlänge (cm)",
    values: [
      "79-80",
      "79-80",
      "80,5-81,5",
      "80,5-81,5",
      "82-83",
      "82-83",
      "82-83",
    ],
  },
]

export default function SizeGuidePage() {
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
            <span className="text-stone-800">Größenberatung</span>
          </nav>
        </div>
      </div>

      <div className="py-12 small:py-20">
        <div className="content-container">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <p className="text-stone-500 uppercase tracking-[0.15em] text-sm mb-2">
                Hilfe
              </p>
              <h1 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-4">
                Größenberatung
              </h1>
              <p className="text-stone-600 max-w-xl mx-auto">
                Finden Sie Ihre perfekte Größe mit unserer Maßtabelle und Messanleitung.
              </p>
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
                  alt="Messanleitung: A1 Brustumfang, A2 Unterbrustumfang, B Taille, C Hüfte, D Armlänge, E innere Beinlänge"
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
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-stone-50">
                    <tr className="border-b border-stone-200">
                      <th
                        rowSpan={2}
                        className="border border-stone-200 px-4 py-3 text-left font-medium text-stone-800 align-middle bg-stone-50"
                      >
                        Größe
                      </th>
                      <th
                        colSpan={2}
                        className="border border-stone-200 px-3 py-2 text-center font-medium text-stone-700"
                      >
                        XS/S
                      </th>
                      <th
                        colSpan={2}
                        className="border border-stone-200 px-3 py-2 text-center font-medium text-stone-700"
                      >
                        M/L
                      </th>
                      <th
                        colSpan={2}
                        className="border border-stone-200 px-3 py-2 text-center font-medium text-stone-700"
                      >
                        XL/XXL
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-stone-200 px-3 py-2 text-center font-medium text-stone-700 align-middle bg-stone-50"
                      >
                        3XL
                      </th>
                    </tr>
                    <tr className="border-b border-stone-200">
                      {sizeSubColumns.map((s) => (
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

            {/* Tips */}
            <div className="bg-stone-100 rounded-2xl p-8">
              <h3 className="font-medium text-stone-800 mb-4">Unsere Tipps</h3>
              <ul className="text-stone-600 text-sm space-y-2">
                <li>• Strickwaren dehnen sich leicht – wählen Sie im Zweifel die kleinere Größe</li>
                <li>• Für einen lockeren Sitz wählen Sie eine Größe größer</li>
                <li>• Bei Fragen kontaktieren Sie unseren Kundenservice für persönliche Beratung</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
