import Image from "next/image"

import { ArrowRight } from "@components/icons"
import { cn } from "@lib/utils"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import styles from "./looks-overview.module.css"

/**
 * Zwischenteil „Aus der Strickerei“ mit dem Archivfoto von /about.
 * Text nur mit Fakten, die schon auf „Über uns“ stehen.
 */
export default function LooksInterlude() {
  return (
    <section
      aria-labelledby="strickerei-title"
      className="bg-white py-12 tablet:py-16 small:py-24"
    >
      <div
        className={cn(
          "content-container grid gap-6 tablet:grid-cols-12 tablet:items-center tablet:gap-x-8 small:gap-x-6",
          styles.reveal
        )}
      >
        <div className="relative aspect-[3/2] overflow-hidden rounded tablet:col-span-6">
          <Image
            fill
            src="/images/about/bild3.png"
            alt="Mitarbeiterinnen in der Strickerei Jutta"
            sizes="(min-width:768px) 50vw, 100vw"
            loading="lazy"
            className="object-cover"
          />
        </div>
        <div className="tablet:col-span-6 small:col-span-5 small:col-start-8">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500">
            Aus der Strickerei
          </p>
          <h2
            id="strickerei-title"
            className="mt-2 font-serif text-3xl font-normal text-stone-900 small:text-4xl"
          >
            Seit drei Generationen in Draßburg
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-7 text-stone-700">
            Alles begann nach dem Zweiten Weltkrieg mit einer einzigen
            Strickmaschine: Damit versorgte die Urgroßmutter von Jutta Strobl
            die Menschen in Draßburg mit neuer Kleidung. Heute führt Jutta
            Strobl die Strickerei in dritter Generation.
          </p>
          <LocalizedClientLink
            href="/about"
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-stone-900 underline underline-offset-4 hover:text-stone-600"
          >
            Unsere Geschichte
            <ArrowRight size={16} aria-hidden />
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}
