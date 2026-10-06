import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowDown, ArrowRight } from "@components/icons"
import HeroVideo from "./hero-video"

// Vollflächiges Intro-Video (Drohnenflug zur Manufaktur), Schrift als HTML darüber –
// ruhig und reduziert, ein Weg: zu den Looks.
const fadeIn = (delay: string) => ({
  animationDelay: delay,
  animationFillMode: "both",
})

const Hero = () => {
  return (
    // Etwas kürzer als der Bildschirm: Farbstreifen und „Shop the Look“ des
    // nächsten Abschnitts schauen unten hervor und laden zum Scrollen ein
    <section className="relative flex h-[calc(100svh_-_7.5rem)] min-h-[32rem] items-end overflow-hidden bg-stone-900 text-white small:h-[calc(100svh_-_9rem)]">
      <HeroVideo />

      {/* Content */}
      <div className="relative z-10 content-container pb-24 text-center small:pb-28">
        <p
          className="text-xs small:text-sm tracking-[0.3em] uppercase text-white/80 animate-fade-in"
          style={fadeIn("0.6s")}
        >
          Draßburg · Burgenland
        </p>

        <h1 className="mt-4 font-serif text-4xl small:text-5xl medium:text-6xl font-medium tracking-tight leading-[1.1] [text-shadow:0_2px_24px_rgb(0_0_0/0.35)]">
          <span className="block animate-fade-in-up" style={fadeIn("0.9s")}>
            Drei Generationen
          </span>
          <span
            className="block text-white/80 animate-fade-in-up"
            style={fadeIn("1.1s")}
          >
            feinster Strickwaren
          </span>
        </h1>

        <span
          aria-hidden="true"
          className="mx-auto mt-6 block h-px w-16 bg-white/70 animate-fade-in"
          style={fadeIn("1.5s")}
        />

        <div
          className="mt-7 flex justify-center animate-fade-in-up"
          style={fadeIn("1.8s")}
        >
          <LocalizedClientLink
            href="/looks"
            className="group inline-flex min-h-11 items-center gap-2 bg-white px-6 text-xs font-medium uppercase tracking-[0.2em] text-stone-900 transition-colors hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white small:text-sm"
          >
            Looks entdecken
            <ArrowRight
              size={16}
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </LocalizedClientLink>
        </div>
      </div>

      {/* Scroll Indicator */}
      {/* FIX: Keep the scroll indicator centered on all viewport widths */}
      <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex justify-center">
        <div className="flex flex-col items-center text-white/70 animate-bounce-soft">
          <span className="text-xs tracking-widest uppercase mb-2">
            Scrollen
          </span>
          <ArrowDown size={20} />
        </div>
      </div>
    </section>
  )
}

export default Hero
