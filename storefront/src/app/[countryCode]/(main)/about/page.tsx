import { Metadata } from "next"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import { ArrowRight } from "@components/icons"
import { IMAGES } from "@lib/constants/images"

export const metadata: Metadata = {
  title: "Über uns",
  description: "Erfahren Sie mehr über Strickerei Jutta - Drei Generationen österreichische Handwerkskunst seit 1965.",
}

export default function AboutPage() {
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
            <span className="text-stone-800">Über uns</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-stone-800 text-white py-24 small:py-32">
        <div className="content-container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-serif text-4xl small:text-5xl medium:text-6xl font-medium mb-6">
              Drei Generationen<br />österreichische Handwerkskunst
            </h1>
            <p className="text-xl small:text-2xl text-stone-300">
              Seit 1965 steht Strickerei Jutta für kompromisslose Qualität und traditionelle Werte
            </p>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-16 small:py-24 bg-white">
        <div className="content-container">
          <div className="grid grid-cols-1 medium:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-6">
                Unsere Geschichte
              </h2>
              <div className="prose prose-stone prose-lg max-w-none space-y-4">
                <p className="text-stone-600">
                  Was 1965 als kleine Familienstrickerei in Draßburg begann, ist heute ein 
                  renommiertes Unternehmen in der dritten Generation. Jutta Müller gründete 
                  das Unternehmen mit der Vision, hochwertige Strickwaren in traditioneller 
                  Handarbeit zu fertigen.
                </p>
                <p className="text-stone-600">
                  Über die Jahre haben wir uns einen Namen für außergewöhnliche Qualität und 
                  zeitloses Design gemacht. Unsere Philosophie ist einfach: Wir verwenden 
                  ausschließlich feinste Naturfasern und fertigen jedes Stück mit der Präzision 
                  und Sorgfalt, die unsere Kunden seit Jahrzehnten schätzen.
                </p>
                <p className="text-stone-600">
                  Heute führt die dritte Generation das Familienunternehmen mit derselben 
                  Leidenschaft und dem gleichen Qualitätsanspruch weiter, der uns seit 
                  über 60 Jahren auszeichnet.
                </p>
              </div>
            </div>
            <div className="relative bg-stone-100 rounded-2xl aspect-[4/3] overflow-hidden">
              <Image
                src={IMAGES.about.historie}
                alt="Strickerei Jutta Historie - Drei Generationen österreichische Handwerkskunst seit 1965"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 small:py-24 bg-stone-50">
        <div className="content-container">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-4">
              Unsere Werte
            </h2>
            <p className="text-lg text-stone-600">
              Diese Prinzipien leiten uns seit der Gründung und prägen jeden Aspekt unserer Arbeit
            </p>
          </div>

          <div className="grid grid-cols-1 small:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                </svg>
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-800 mb-4">Handwerkskunst</h3>
              <p className="text-stone-600">
                Jedes Stück wird mit traditionellen Techniken und höchster Präzision von Hand gefertigt. 
                Unsere erfahrenen Handwerker bringen jahrzehntelange Expertise in jedes Produkt ein.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-800 mb-4">Natürlichkeit</h3>
              <p className="text-stone-600">
                Wir verwenden ausschließlich feinste Naturfasern wie Kaschmir, Merinowolle und Alpaka. 
                Nachhaltigkeit und Umweltbewusstsein sind feste Bestandteile unserer Philosophie.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-800 mb-4">Qualität</h3>
              <p className="text-stone-600">
                Kompromisslose Qualität ist unser Markenzeichen. Von der Materialauswahl bis zur 
                finalen Kontrolle unterliegt jedes Produkt strengsten Qualitätsstandards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 small:py-24 bg-white">
        <div className="content-container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-4">
              Unsere Meilensteine
            </h2>
            <p className="text-lg text-stone-600">
              60 Jahre Tradition und Innovation
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            {/* 1965 */}
            <div className="grid grid-cols-1 small:grid-cols-2 gap-8 items-center">
              <div className="small:text-right">
                <div className="text-2xl font-bold text-stone-800 mb-2">1965</div>
                <h3 className="font-serif text-xl font-medium text-stone-800 mb-4">Die Gründung</h3>
                <p className="text-stone-600">
                  Jutta Müller gründet die Strickerei in Draßburg mit dem Ziel, 
                  hochwertige Strickwaren in traditioneller Handarbeit zu fertigen.
                </p>
              </div>
              <div className="bg-stone-100 rounded-2xl aspect-[4/3] flex items-center justify-center">
                <span className="text-stone-400 font-serif">1965</span>
              </div>
            </div>

            {/* 1985 */}
            <div className="grid grid-cols-1 small:grid-cols-2 gap-8 items-center">
              <div className="bg-stone-100 rounded-2xl aspect-[4/3] flex items-center justify-center small:order-1">
                <span className="text-stone-400 font-serif">1985</span>
              </div>
              <div className="small:order-2">
                <div className="text-2xl font-bold text-stone-800 mb-2">1985</div>
                <h3 className="font-serif text-xl font-medium text-stone-800 mb-4">Expansion</h3>
                <p className="text-stone-600">
                  Die zweite Generation übernimmt das Unternehmen und erweitert 
                  das Sortiment um exklusive Kaschmir-Kollektionen.
                </p>
              </div>
            </div>

            {/* 2010 */}
            <div className="grid grid-cols-1 small:grid-cols-2 gap-8 items-center">
              <div className="small:text-right">
                <div className="text-2xl font-bold text-stone-800 mb-2">2010</div>
                <h3 className="font-serif text-xl font-medium text-stone-800 mb-4">Modernisierung</h3>
                <p className="text-stone-600">
                  Investition in moderne Technologien bei gleichzeitiger Bewahrung 
                  traditioneller Handwerkstechniken.
                </p>
              </div>
              <div className="bg-stone-100 rounded-2xl aspect-[4/3] flex items-center justify-center">
                <span className="text-stone-400 font-serif">2010</span>
              </div>
            </div>

            {/* 2024 */}
            <div className="grid grid-cols-1 small:grid-cols-2 gap-8 items-center">
              <div className="bg-stone-100 rounded-2xl aspect-[4/3] flex items-center justify-center small:order-1">
                <span className="text-stone-400 font-serif">2024</span>
              </div>
              <div className="small:order-2">
                <div className="text-2xl font-bold text-stone-800 mb-2">2024</div>
                <h3 className="font-serif text-xl font-medium text-stone-800 mb-4">Digitale Zukunft</h3>
                <p className="text-stone-600">
                  Launch des neuen Online-Shops und Expansion in internationale Märkte 
                  unter Führung der dritten Generation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 small:py-24 bg-stone-50">
        <div className="content-container">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-4">
              Unser Team
            </h2>
            <p className="text-lg text-stone-600">
              Leidenschaftliche Handwerker und Experten, die unsere Tradition weitertragen
            </p>
          </div>

          <div className="grid grid-cols-1 small:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-stone-100 aspect-[3/4] flex items-center justify-center">
                <span className="text-stone-400">Foto</span>
              </div>
              <div className="p-6 text-center">
                <h3 className="font-medium text-stone-800 mb-1">Anna Müller</h3>
                <p className="text-sm text-stone-500 mb-3">Geschäftsführerin, 3. Generation</p>
                <p className="text-sm text-stone-600">
                  Führt das Familienunternehmen mit Leidenschaft und Innovation in die digitale Zukunft.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-stone-100 aspect-[3/4] flex items-center justify-center">
                <span className="text-stone-400">Foto</span>
              </div>
              <div className="p-6 text-center">
                <h3 className="font-medium text-stone-800 mb-1">Franz Weber</h3>
                <p className="text-sm text-stone-500 mb-3">Meister-Stricker</p>
                <p className="text-sm text-stone-600">
                  Über 30 Jahre Erfahrung in der Verarbeitung feinster Naturfasern und traditioneller Stricktechniken.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-stone-100 aspect-[3/4] flex items-center justify-center">
                <span className="text-stone-400">Foto</span>
              </div>
              <div className="p-6 text-center">
                <h3 className="font-medium text-stone-800 mb-1">Maria Koller</h3>
                <p className="text-sm text-stone-500 mb-3">Design & Qualitätskontrolle</p>
                <p className="text-sm text-stone-600">
                  Verantwortlich für die Entwicklung neuer Kollektionen und die Einhaltung höchster Qualitätsstandards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability Section */}
      <section className="py-16 small:py-24 bg-white">
        <div className="content-container">
          <div className="grid grid-cols-1 medium:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="bg-stone-100 rounded-2xl aspect-[4/3] flex items-center justify-center">
              <span className="text-stone-400 font-serif text-lg">Nachhaltigkeit</span>
            </div>
            <div>
              <h2 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-6">
                Nachhaltigkeit & Verantwortung
              </h2>
              <div className="prose prose-stone prose-lg max-w-none space-y-4 mb-8">
                <p className="text-stone-600">
                  Nachhaltigkeit ist für uns nicht nur ein Trend, sondern eine 
                  Verpflichtung gegenüber zukünftigen Generationen. Wir arbeiten 
                  ausschließlich mit Lieferanten zusammen, die unsere Werte teilen 
                  und höchste ethische Standards einhalten.
                </p>
                <p className="text-stone-600">
                  Unsere Naturfasern stammen von zertifizierten Betrieben, die 
                  Tierwohl und Umweltschutz großschreiben. Durch die Langlebigkeit 
                  unserer Produkte tragen wir zu einer nachhaltigen Mode bei, 
                  die über Jahre hinweg Freude bereitet.
                </p>
              </div>
              
              <div className="grid grid-cols-2 small:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-stone-800">100%</div>
                  <div className="text-sm text-stone-600">Naturfasern</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-stone-800">60+</div>
                  <div className="text-sm text-stone-600">Jahre Erfahrung</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-stone-800">3</div>
                  <div className="text-sm text-stone-600">Generationen</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-stone-800">∞</div>
                  <div className="text-sm text-stone-600">Leidenschaft</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 small:py-24 bg-stone-800 text-white">
        <div className="content-container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-3xl small:text-4xl font-medium mb-6">
              Erleben Sie österreichische Handwerkskunst
            </h2>
            <p className="text-xl text-stone-300 mb-8">
              Entdecken Sie unsere aktuellen Kollektionen und lassen Sie sich von 
              60 Jahren Tradition und Qualität überzeugen.
            </p>
            <div className="flex flex-col small:flex-row gap-4 justify-center">
              <LocalizedClientLink href="/store">
                <Button className="bg-white text-stone-800 hover:bg-stone-100">
                  Kollektionen entdecken
                </Button>
              </LocalizedClientLink>
              <LocalizedClientLink href="/contact">
                <Button variant="secondary" className="border-white text-white hover:bg-white hover:text-stone-800">
                  Kontakt aufnehmen
                </Button>
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
