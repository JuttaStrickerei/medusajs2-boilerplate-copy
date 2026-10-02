import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { StoreLook } from "@lib/data/looks"

export default function LookCard({ look }: { look: StoreLook }) {
  const hero = look.images?.[0] ?? look.product_thumbnails[0]
  const count = look.product_ids.length

  return (
    <LocalizedClientLink
      href={`/looks/${look.handle}`}
      className="group block h-full"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-stone-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-stone-200 hover:shadow-lg">
        <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200">
          {hero && (
            <Image
              src={hero}
              alt={look.title}
              fill
              sizes="(max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </div>
        <div className="flex flex-col gap-1 px-4 py-3">
          <h2 className="text-sm small:text-base font-medium text-stone-800 line-clamp-2">
            {look.title}
          </h2>
          <p className="text-xs text-stone-500">
            {count === 1 ? "1 Teil" : `${count} Teile`}
          </p>
        </div>
      </article>
    </LocalizedClientLink>
  )
}
