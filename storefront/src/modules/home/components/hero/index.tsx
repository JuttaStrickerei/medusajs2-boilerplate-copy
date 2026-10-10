import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowRight } from "@components/icons"
import HeroVideo from "./hero-video"

// Vollflächiges Intro-Video (Drohnenflug zur Manufaktur), Schrift als HTML darüber –
// ruhig und reduziert, ein Weg: zu den Looks. Unten schauen die Farbwelt-Türen
// herein (--home-overlap, siehe section-styles.ts).
const fadeIn = (delay: string) => ({
  animationDelay: delay,
  animationFillMode: "both",
})

const Hero = () => {
  return (
    // Bildschirm minus Kopfzeile (h-16 / h-20); die Türen liegen im unteren Teil
    <section className="relative flex h-[calc(100svh_-_4rem)] min-h-[34rem] items-end overflow-hidden bg-stone-900 text-white small:h-[calc(100svh_-_5rem)]">
      {/* Content, über den hereinschauenden Türen */}
      <div className="relative z-10 content-container pb-[calc(var(--home-overlap,0px)_+_2rem)] text-center small:pb-[calc(var(--home-overlap,0px)_+_3rem)]">
        <p
          className="text-xs small:text-sm tracking-[0.3em] small:tracking-[0.3em] uppercase text-white/80 animate-fade-in [@media(max-height:640px)]:hidden"
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
            className="group inline-flex min-h-11 items-center gap-2 bg-white px-6 text-xs font-medium uppercase tracking-[0.2em] text-stone-900 transition-colors hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white small:text-sm small:tracking-[0.2em]"
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

      {/* Nach dem Text, damit Tab erst „Looks entdecken“ erreicht und dann
          den Video-Knopf in der Zeile darunter (z-10 hält den Text oben) */}
      <HeroVideo />
    </section>
  )
}

export default Hero
