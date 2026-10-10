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

/** Unter der zweiten Kopfzeile nur XS–XXL; 3XL sitzt im ersten Kopf mit rowSpan. */
const sizeSubColumns = ["XS", "S", "M", "L", "XL", "XXL"] as const

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
                <li>
                  • Strickwaren dehnen sich leicht – wählen Sie im Zweifel die
                  kleinere Größe
                </li>
                <li>• Für einen lockeren Sitz wählen Sie eine Größe größer</li>
                <li>
                  • Bei Fragen kontaktieren Sie unseren Kundenservice für
                  persönliche Beratung
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
