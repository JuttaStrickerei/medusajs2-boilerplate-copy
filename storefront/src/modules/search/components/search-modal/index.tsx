"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { Search, X, ArrowRight } from "@components/icons"
import { cn } from "@lib/utils"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { searchProducts } from "@lib/data/products"
import { convertToLocale } from "@lib/util/money"
import Spinner from "@modules/common/icons/spinner"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { countryCode } = useParams()

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      setHasSearched(true)
      
      try {
        const products = await searchProducts(query, countryCode as string)
        setResults(products)
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, countryCode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/${countryCode}/results/${encodeURIComponent(query)}`)
      onClose()
    }
  }

  const handleProductClick = () => {
    setQuery("")
    setResults([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-0 top-0 z-[101] p-4 small:p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center px-6 border-b border-stone-200">
              <Search size={20} className="text-stone-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Produkte suchen..."
                className="flex-1 px-4 py-5 text-lg outline-none placeholder:text-stone-400"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="ml-2 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Esc
              </button>
            </div>
          </form>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-6 h-6 animate-spin text-stone-400" />
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {results.slice(0, 6).map((product) => (
                  <LocalizedClientLink
                    key={product.id}
                    href={`/products/${product.handle}`}
                    onClick={handleProductClick}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                      {product.thumbnail ? (
                        <Image
                          src={product.thumbnail}
                          alt={product.title || ""}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <Search size={20} />
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-stone-800 truncate">
                        {product.title}
                      </h4>
                      {product.collection && (
                        <p className="text-sm text-stone-500 truncate">
                          {product.collection.title}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    {product.variants?.[0]?.calculated_price && (
                      <div className="text-right flex-shrink-0">
                        <span className="font-medium text-stone-800">
                          {convertToLocale({
                            amount: (product.variants[0].calculated_price as any).calculated_amount_with_tax || 
                                   (product.variants[0].calculated_price as any).calculated_amount,
                            currency_code: (product.variants[0].calculated_price as any).currency_code || "EUR",
                          })}
                        </span>
                      </div>
                    )}

                    <ArrowRight size={16} className="text-stone-400 flex-shrink-0" />
                  </LocalizedClientLink>
                ))}

                {/* View All Link */}
                {results.length > 6 && (
                  <LocalizedClientLink
                    href={`/results/${encodeURIComponent(query)}`}
                    onClick={handleProductClick}
                    className="flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-50 transition-colors"
                  >
                    Alle {results.length} Ergebnisse anzeigen
                    <ArrowRight size={16} />
                  </LocalizedClientLink>
                )}
              </div>
            ) : hasSearched && query.trim() ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-stone-400" />
                </div>
                <p className="text-stone-600 mb-1">Keine Ergebnisse für "{query}"</p>
                <p className="text-sm text-stone-400">
                  Versuchen Sie einen anderen Suchbegriff
                </p>
              </div>
            ) : (
              <div className="px-6 py-8">
                <p className="text-sm text-stone-500 mb-4">Beliebte Suchen</p>
                <div className="flex flex-wrap gap-2">
                  {["Pullover", "Kaschmir", "Schal", "Merinowolle"].map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-4 py-2 bg-stone-100 text-stone-600 rounded-full text-sm hover:bg-stone-200 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

