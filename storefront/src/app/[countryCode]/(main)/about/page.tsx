import { Metadata } from "next"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"

export const metadata: Metadata = {
  title: "Über uns",
  description:
    "Unsere Geschichte: Von der ersten Nähmaschine zur digitalen Boutique – Strickerei Jutta aus Draßburg.",
}

const storySections: {
  title: string
  body: string
  image: string
  imageAlt: string
}[] = [
  {
    title: "Der Grundstein in Draßburg",
    body: "Alles begann in der herausfordernden Zeit nach dem Zweiten Weltkrieg mit einer einzigen Nähmaschine. Die Urgroßmutter der heutigen Inhaberin, Jutta Strobl, erwarb diese Maschine, um die Bewohner der burgenländischen Ortschaft Draßburg mit neuer Kleidung zu versorgen und bestehende Stücke sorgfältig zu reparieren. Was damals aus einer alltäglichen Notwendigkeit und dem Wunsch zu helfen entstand, legte das unerschütterliche Fundament für unsere familiäre Handwerkskunst.",
    image: "/images/about/bild1.png",
    imageAlt: "Historische Ansicht von Draßburg",
  },
  {
    title: "Von der Leidenschaft zum österreichweiten Großhandel",
    body: "Die Liebe zu Textilien und solider Handarbeit wurde in der Familie weitergegeben. Nach ihrer Schulzeit entdeckte die ehemalige Geschäftsführerin Maria Barilits ihre eigene Leidenschaft für das Nähen. Sie übernahm die traditionsreiche Nähmaschine ihrer Großmutter und wagte entschlossen den Schritt in die Selbstständigkeit. Durch ihr Engagement und ein untrügliches Gespür für Qualität wuchs das Geschäft stetig. Es folgten Investitionen in neue Maschinen und zusätzliche Mitarbeiter. Aus dem kleinen Handwerksbetrieb wurde ein erfolgreiches Großhandelsunternehmen, das Boutiquen in ganz Österreich belieferte – mit Kleidungsstücken, die durch diese Partner schließlich weit über die Landesgrenzen hinaus ihre Träger fanden.",
    image: "/images/about/bild2.png",
    imageAlt: "Das Team der Strickerei Jutta",
  },
  {
    title: "Eine neue Generation, eine neue Ausrichtung",
    body: "Mode lag auch Jutta Strobl schon von Kindesbeinen an im Blut. Nach ihrem erfolgreichen Abschluss am Textilcollege und dem Sammeln wertvoller beruflicher Erfahrungen im Ausland, zog es sie zurück zu den familiären Wurzeln. Mit ihrem Einstieg in das Familiengeschäft begann ein neues Kapitel: Sie leitete eine strategische Neuausrichtung ein. Zwar blieb der Großhandel stets eine tragende und wichtige Säule des Unternehmens, doch das Kerngeschäft wandelte sich zunehmend hin zum Einzelhandel. Der direkte Kontakt und die persönliche Beratung unserer Kundinnen und Kunden rückten damit ins Zentrum unserer täglichen Arbeit.",
    image: "/images/about/bild3.png",
    imageAlt: "Mitarbeiterinnen der Strickerei Jutta",
  },
  {
    title: "Tradition trifft auf Digitalisierung",
    body: "Um unsere Mode für Sie noch zugänglicher zu machen, gehen wir nun den nächsten logischen Schritt. Mit der Eröffnung dieses Onlineshops überwinden wir räumliche Distanzen und bringen unsere Kollektionen direkt zu Ihnen nach Hause. So verbinden wir die handwerkliche Tradition und die Liebe zum Detail, die einst in Draßburg ihren Anfang nahm, mit den modernen Möglichkeiten von heute.",
    image: "/images/about/bild4.png",
    imageAlt: "Das Gebäude der Strickerei Jutta",
  },
]

/** Hohler Kreis als Zeitmarkierung */
function CircleMarker() {
  return (
    <div className="size-5 rounded-full border-2 border-stone-400 bg-white" />
  )
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
            <h1 className="font-serif text-3xl small:text-4xl medium:text-5xl font-medium leading-tight">
              <span className="block">Unsere Geschichte:</span>
              <span className="block mt-3 small:mt-4">
                Von der ersten Nähmaschine zur digitalen Boutique
              </span>
            </h1>
          </div>
        </div>
      </section>

      {/* Story — vertikale Timeline */}
      <section className="py-16 small:py-24 bg-white">
        <div className="content-container">
          <div className="max-w-5xl mx-auto">

            {/* Mobile: Einfache Liste mit Bildern */}
            <div className="small:hidden space-y-12">
              {storySections.map((block) => (
                <div key={block.title}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl mb-5 bg-stone-100">
                    <Image
                      src={block.image}
                      alt={block.imageAlt}
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                  <h2 className="font-serif text-xl font-medium text-stone-800 mb-3">
                    {block.title}
                  </h2>
                  <p className="text-stone-600 leading-relaxed">{block.body}</p>
                </div>
              ))}
              <p className="text-center text-lg text-stone-600 pt-4">
                Wir freuen uns, dass Sie uns auf diesem Weg begleiten und Teil unserer Geschichte sind.
              </p>
            </div>

            {/* Desktop: Timeline mit abwechselnden Text + Bild Blöcken */}
            <div className="hidden small:block">
              <div className="relative">
                {/* Zentrale vertikale Linie */}
                <div
                  className="absolute left-1/2 top-0 w-px bg-stone-200"
                  style={{
                    transform: "translateX(-50%)",
                    height: "calc(100% - 6rem)",
                  }}
                />

                {/* Story Items */}
                <div className="space-y-20">
                  {storySections.map((block, index) => {
                    const isLeft = index % 2 === 0

                    return (
                      <div key={block.title} className="relative">
                        {/* Kreis auf der Linie */}
                        <div
                          className="absolute top-0 z-10"
                          style={{ left: "50%", transform: "translateX(-50%)" }}
                        >
                          <CircleMarker />
                        </div>

                        {/* Content Grid: Text auf einer Seite, Bild auf der anderen */}
                        <div className="grid grid-cols-2 gap-0">
                          {/* Linke Spalte */}
                          <div className="pr-12">
                            {isLeft ? (
                              /* Text links */
                              <div className="text-right">
                                <h2 className="font-serif text-2xl medium:text-3xl font-medium text-stone-800 mb-4">
                                  {block.title}
                                </h2>
                                <p className="text-stone-600 leading-relaxed">{block.body}</p>
                              </div>
                            ) : (
                              /* Bild links */
                              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-100">
                                <Image
                                  src={block.image}
                                  alt={block.imageAlt}
                                  fill
                                  sizes="40vw"
                                  className="object-cover"
                                />
                              </div>
                            )}
                          </div>

                          {/* Rechte Spalte */}
                          <div className="pl-12">
                            {isLeft ? (
                              /* Bild rechts */
                              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-100">
                                <Image
                                  src={block.image}
                                  alt={block.imageAlt}
                                  fill
                                  sizes="40vw"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              /* Text rechts */
                              <div className="text-left">
                                <h2 className="font-serif text-2xl medium:text-3xl font-medium text-stone-800 mb-4">
                                  {block.title}
                                </h2>
                                <p className="text-stone-600 leading-relaxed">{block.body}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Abschlusstext */}
                <div className="text-center mt-16 max-w-2xl mx-auto">
                  <p className="text-lg text-stone-600">
                    Wir freuen uns, dass Sie uns auf diesem Weg begleiten und Teil unserer Geschichte
                    sind.
                  </p>
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
              Entdecken Sie unsere aktuellen Kollektionen und überzeugen Sie sich von Qualität und
              Tradition.
            </p>
            <div className="flex flex-col small:flex-row gap-4 justify-center">
              <LocalizedClientLink href="/store">
                <Button className="bg-white text-stone-800 hover:bg-stone-100">
                  Kollektionen entdecken
                </Button>
              </LocalizedClientLink>
              <LocalizedClientLink href="/contact">
                <Button
                  variant="secondary"
                  className="border-white text-white hover:bg-white hover:text-stone-800"
                >
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
