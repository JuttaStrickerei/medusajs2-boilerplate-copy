import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Ruler } from "@components/icons"

export const metadata: Metadata = {
  title: "Größenberatung",
  description: "Finden Sie Ihre perfekte Größe mit unserer Größentabelle und Messanleitung.",
}

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
                Finden Sie Ihre perfekte Größe mit unserer Anleitung.
              </p>
            </div>

          {/* Measuring Guide */}
          <div className="bg-white rounded-2xl border border-stone-200 p-8 mb-8">
            <h2 className="font-serif text-xl font-medium text-stone-800 mb-6 flex items-center gap-3">
              <Ruler size={24} />
              So messen Sie richtig
            </h2>

            <div className="grid grid-cols-1 small:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-stone-50 rounded-xl">
                <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-600 font-medium">
                  1
                </div>
                <h3 className="font-medium text-stone-800 mb-2">Brustumfang</h3>
                <p className="text-sm text-stone-600">
                  Messen Sie um die stärkste Stelle der Brust, unter den Armen.
                </p>
              </div>
              <div className="text-center p-4 bg-stone-50 rounded-xl">
                <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-600 font-medium">
                  2
                </div>
                <h3 className="font-medium text-stone-800 mb-2">Taillenumfang</h3>
                <p className="text-sm text-stone-600">
                  Messen Sie um die schmalste Stelle Ihrer Taille.
                </p>
              </div>
              <div className="text-center p-4 bg-stone-50 rounded-xl">
                <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-600 font-medium">
                  3
                </div>
                <h3 className="font-medium text-stone-800 mb-2">Hüftumfang</h3>
                <p className="text-sm text-stone-600">
                  Messen Sie um die breiteste Stelle der Hüfte.
                </p>
              </div>
            </div>
          </div>

          {/* Size Table - Damen */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-8">
            <h2 className="font-serif text-lg font-medium text-stone-800 px-6 py-4 bg-stone-50 border-b border-stone-200">
              Damen Größentabelle
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-stone-600">Größe</th>
                    <th className="px-6 py-3 text-left font-medium text-stone-600">EU</th>
                    <th className="px-6 py-3 text-left font-medium text-stone-600">Brust (cm)</th>
                    <th className="px-6 py-3 text-left font-medium text-stone-600">Taille (cm)</th>
                    <th className="px-6 py-3 text-left font-medium text-stone-600">Hüfte (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr><td className="px-6 py-3 font-medium">XS</td><td className="px-6 py-3">34</td><td className="px-6 py-3">80-84</td><td className="px-6 py-3">62-66</td><td className="px-6 py-3">88-92</td></tr>
                  <tr><td className="px-6 py-3 font-medium">S</td><td className="px-6 py-3">36</td><td className="px-6 py-3">84-88</td><td className="px-6 py-3">66-70</td><td className="px-6 py-3">92-96</td></tr>
                  <tr><td className="px-6 py-3 font-medium">M</td><td className="px-6 py-3">38</td><td className="px-6 py-3">88-92</td><td className="px-6 py-3">70-74</td><td className="px-6 py-3">96-100</td></tr>
                  <tr><td className="px-6 py-3 font-medium">L</td><td className="px-6 py-3">40</td><td className="px-6 py-3">92-96</td><td className="px-6 py-3">74-78</td><td className="px-6 py-3">100-104</td></tr>
                  <tr><td className="px-6 py-3 font-medium">XL</td><td className="px-6 py-3">42</td><td className="px-6 py-3">96-102</td><td className="px-6 py-3">78-84</td><td className="px-6 py-3">104-110</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Size Table - Herren */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-8">
            <h2 className="font-serif text-lg font-medium text-stone-800 px-6 py-4 bg-stone-50 border-b border-stone-200">
              Herren Größentabelle
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-stone-600">Größe</th>
                    <th className="px-6 py-3 text-left font-medium text-stone-600">EU</th>
                    <th className="px-6 py-3 text-left font-medium text-stone-600">Brust (cm)</th>
                    <th className="px-6 py-3 text-left font-medium text-stone-600">Taille (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr><td className="px-6 py-3 font-medium">S</td><td className="px-6 py-3">46</td><td className="px-6 py-3">92-96</td><td className="px-6 py-3">80-84</td></tr>
                  <tr><td className="px-6 py-3 font-medium">M</td><td className="px-6 py-3">48</td><td className="px-6 py-3">96-100</td><td className="px-6 py-3">84-88</td></tr>
                  <tr><td className="px-6 py-3 font-medium">L</td><td className="px-6 py-3">50</td><td className="px-6 py-3">100-104</td><td className="px-6 py-3">88-92</td></tr>
                  <tr><td className="px-6 py-3 font-medium">XL</td><td className="px-6 py-3">52</td><td className="px-6 py-3">104-110</td><td className="px-6 py-3">92-98</td></tr>
                  <tr><td className="px-6 py-3 font-medium">XXL</td><td className="px-6 py-3">54</td><td className="px-6 py-3">110-116</td><td className="px-6 py-3">98-104</td></tr>
                </tbody>
              </table>
            </div>
          </div>

            {/* Tips */}
            <div className="bg-stone-100 rounded-2xl p-8">
              <h3 className="font-medium text-stone-800 mb-4">Unsere Tipps</h3>
              <ul className="text-stone-600 text-sm space-y-2">
                <li>• Strickwaren dehnen sich leicht - wählen Sie im Zweifel die kleinere Größe</li>
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

