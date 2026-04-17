import { Metadata } from "next"
import Image from "next/image"
import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import NewsletterForm from "@modules/home/components/newsletter-form"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import { IMAGES } from "@lib/constants/images"

export const metadata: Metadata = {
  title: "Strickerei Jutta | Österreichische Handwerkskunst in 3. Generation",
  description:
    "Entdecken Sie handgefertigte Strickwaren aus feinsten Naturfasern. Kaschmir, Merinowolle und Alpaka - 60 Jahre Tradition und Qualität aus Österreich.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params

  const region = await getRegion(countryCode)
  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Featured Products */}
      <FeaturedProducts collections={collections} region={region} />

      {/* About Section — Bild wie auf /about: 4:3, gleiche Breite wie Timeline (max-w-5xl) */}
      <section className="section-container bg-stone-50">
        <div className="content-container">
          <div className="grid medium:grid-cols-2 gap-12 medium:gap-16 items-center max-w-5xl mx-auto">
            {/* Image */}
            <div className="relative aspect-[4/3] w-full bg-stone-200 rounded-2xl overflow-hidden">
              <Image
                src={IMAGES.home.manufaktur}
                alt="Strickerei Jutta Manufaktur - Traditionelle Handwerkskunst in 3. Generation"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              {/* Floating Badge */}
              <div className="absolute bottom-6 left-6 bg-white p-4 rounded-xl shadow-lg z-10">
                <p className="font-serif text-2xl font-medium text-stone-800">in 3. Generation</p>
                <p className="text-sm text-stone-600">Gegründet in Draßburg</p>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <p className="text-sm text-stone-500 tracking-[0.15em] uppercase">
                Unsere Geschichte
              </p>
              <h2 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 leading-tight">
                Über 60 Jahre österreichische Tradition
              </h2>
              <div className="space-y-4 text-stone-600 leading-relaxed">
                <p>
                  Unsere Philosophie ist einfach: Qualität ohne Kompromisse. Wir verwenden 
                  ausschließlich feinste Naturfasern und fertigen jedes Stück mit der Präzision 
                  und Sorgfalt, die unsere Kunden seit Jahrzehnten schätzen.
                </p>
              </div>
              <div className="pt-4">
                <LocalizedClientLink href="/about">
                  <Button variant="secondary">
                    Mehr erfahren
                  </Button>
                </LocalizedClientLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section-container bg-stone-800 text-white">
        <div className="content-container text-center">
          <NewsletterForm />
        </div>
      </section>
    </>
  )
}
