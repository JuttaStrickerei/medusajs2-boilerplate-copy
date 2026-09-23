import { Badge, Button, IconButton, Input, Text } from "@medusajs/ui"
import { ArrowDownMini, ArrowUpMini, Trash } from "@medusajs/icons"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { sdk } from "../../../lib/sdk"
import type { LookProduct } from "./types"

type ProductPickerProps = {
  value: LookProduct[]
  onChange: (products: LookProduct[]) => void
}

const useDebounced = (value: string, delay = 300) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const PAGE_SIZE = 20

const Thumb = ({ src }: { src?: string | null }) =>
  src ? (
    <img src={src} alt="" className="h-12 w-9 rounded object-cover" />
  ) : (
    <div className="h-12 w-9 rounded bg-ui-bg-component" />
  )

// Produktauswahl für einen Look: sortierbare Liste der Teile + durchscrollbare
// Produktliste (ab 2 Zeichen gefiltert), lädt beim Scrollen weitere Produkte nach
export const ProductPicker = ({ value, onChange }: ProductPickerProps) => {
  const [search, setSearch] = useState("")
  const debounced = useDebounced(search.trim())
  const q = debounced.length > 1 ? debounced : ""

  const { data, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["look-product-picker", q],
      queryFn: ({ pageParam }) =>
        sdk.admin.product.list({
          q: q || undefined,
          limit: PAGE_SIZE,
          offset: pageParam,
          order: "title",
          fields: "id,title,handle,thumbnail,status",
        }),
      initialPageParam: 0,
      getNextPageParam: (last, pages) => {
        const loaded = pages.reduce((n, p) => n + p.products.length, 0)
        return loaded < last.count ? loaded : undefined
      },
    })

  const selectedIds = new Set(value.map((p) => p.id))
  const results = (data?.pages ?? [])
    .flatMap((page) => page.products)
    .filter((p) => !selectedIds.has(p.id))

  const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
    const el = e.currentTarget
    if (
      hasNextPage &&
      !isFetchingNextPage &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - 40
    ) {
      fetchNextPage()
    }
  }

  const move = (from: number, to: number) => {
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      {value.length > 0 ? (
        <ul className="divide-y rounded-lg border border-ui-border-base">
          {value.map((product, index) => (
            <li key={product.id} className="flex items-center gap-3 p-2">
              <Thumb src={product.thumbnail} />
              <div className="flex-1">
                <Text size="small" weight="plus">
                  {product.title}
                </Text>
                {product.status && product.status !== "published" && (
                  <Badge size="2xsmall" color="orange">
                    Nicht veröffentlicht – im Shop ausgeblendet
                  </Badge>
                )}
              </div>
              <IconButton
                size="small"
                variant="transparent"
                type="button"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                <ArrowUpMini />
              </IconButton>
              <IconButton
                size="small"
                variant="transparent"
                type="button"
                disabled={index === value.length - 1}
                onClick={() => move(index, index + 1)}
              >
                <ArrowDownMini />
              </IconButton>
              <IconButton
                size="small"
                variant="transparent"
                type="button"
                onClick={() => onChange(value.filter((p) => p.id !== product.id))}
              >
                <Trash />
              </IconButton>
            </li>
          ))}
        </ul>
      ) : (
        <Text size="small" className="text-ui-fg-subtle">
          Noch keine Produkte ausgewählt.
        </Text>
      )}

      <div className="flex flex-col gap-2">
        <Input
          type="search"
          placeholder="Produkt suchen oder unten auswählen …"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul
          className="max-h-72 divide-y overflow-y-auto rounded-lg border border-ui-border-base"
          onScroll={handleScroll}
        >
          {isFetching && !results.length && (
            <li className="p-3">
              <Text size="small" className="text-ui-fg-subtle">
                Produkte werden geladen …
              </Text>
            </li>
          )}
          {!isFetching && !results.length && (
            <li className="p-3">
              <Text size="small" className="text-ui-fg-subtle">
                Keine Produkte gefunden.
              </Text>
            </li>
          )}
          {results.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 p-2 text-left hover:bg-ui-bg-base-hover"
                onClick={() => {
                  onChange([
                    ...value,
                    {
                      id: product.id,
                      title: product.title,
                      handle: product.handle,
                      thumbnail: product.thumbnail,
                      status: product.status,
                    },
                  ])
                  // Suche leeren, damit das nächste Teil direkt gesucht werden kann
                  setSearch("")
                }}
              >
                <Thumb src={product.thumbnail} />
                <Text size="small">{product.title}</Text>
                {product.status !== "published" && (
                  <Badge size="2xsmall" color="orange">
                    Nicht veröffentlicht
                  </Badge>
                )}
              </button>
            </li>
          ))}
          {hasNextPage && (
            <li className="p-2 text-center">
              <Button
                type="button"
                variant="transparent"
                size="small"
                isLoading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                Weitere Produkte laden
              </Button>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
