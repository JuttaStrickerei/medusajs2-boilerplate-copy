import { Metadata } from "next"
import Image from "next/image"
import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import { Sparkles, RefreshCw, Shield } from "@components/icons"
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

      {/* Trust Badges Section */}
      <section className="py-12 small:py-16 bg-stone-50 border-y border-stone-200">
        <div className="content-container">
          <div className="grid grid-cols-2 medium:grid-cols-3 gap-8">
            <TrustBadge
              icon={<Sparkles size={24} />}
              title="Handarbeit"
              description="Jedes Stück ein Unikat"
            />
            <TrustBadge
              icon={<Shield size={24} />}
              title="Premium Qualität"
              description="100% Naturfasern"
            />
            <TrustBadge
              icon={<RefreshCw size={24} />}
              title="30 Tage Rückgabe"
              description="Einfach"
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <FeaturedProducts collections={collections} region={region} />

      {/* About Section */}
      <section className="section-container bg-stone-50">
        <div className="content-container">
          <div className="grid medium:grid-cols-2 gap-12 medium:gap-16 items-center">
            {/* Image */}
            <div className="relative aspect-[4/5] bg-stone-200 rounded-2xl overflow-hidden">
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
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="font-serif text-3xl small:text-4xl font-medium">
              Bleiben Sie informiert
            </h2>
            <p className="text-stone-300 leading-relaxed">
              Erhalten Sie exklusive Einblicke in neue Kollektionen, 
              Pflegetipps für Ihre Strickwaren und besondere Angebote.
            </p>
            <form className="flex flex-col small:flex-row gap-3 max-w-md mx-auto pt-4">
              <input
                type="email"
                placeholder="Ihre E-Mail-Adresse"
                className="flex-1 px-4 py-3 rounded-lg bg-stone-700 border border-stone-600 text-white placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
              />
              <Button type="submit" className="bg-white text-stone-800 hover:bg-stone-100">
                Anmelden
              </Button>
            </form>
            <p className="text-xs text-stone-500">
              Mit der Anmeldung stimmen Sie unseren{" "}
              <LocalizedClientLink href="/privacy" className="underline hover:text-white">
                Datenschutzrichtlinien
              </LocalizedClientLink>{" "}
              zu.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

// Trust Badge Component
function TrustBadge({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-3 text-white">
        {icon}
      </div>
      <h3 className="font-medium text-stone-800 mb-1">{title}</h3>
      <p className="text-sm text-stone-500">{description}</p>
    </div>
  )
}
