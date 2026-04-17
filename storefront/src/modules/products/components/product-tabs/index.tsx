"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

type ProductDetail = {
  label: string
  value: string
}

function getProductDetails(product: HttpTypes.StoreProduct): ProductDetail[] {
  const details: ProductDetail[] = []

  if (product.material) {
    details.push({ label: "Material", value: product.material })
  }
  if (product.origin_country) {
    details.push({ label: "Herkunftsland", value: product.origin_country })
  }
  if (product.type?.value) {
    details.push({ label: "Produkttyp", value: product.type.value })
  }
  if (product.weight) {
    details.push({ label: "Gewicht", value: `${product.weight} g` })
  }
  if (product.length && product.width && product.height) {
    details.push({
      label: "Maße",
      value: `${product.length} × ${product.width} × ${product.height} cm`,
    })
  }

  return details
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const details = getProductDetails(product)
  const hasDetails = details.length > 0

  return (
    <div className="grid grid-cols-1 medium:grid-cols-2 gap-6 max-w-5xl mx-auto">
      {/* Produktdetails Card */}
      {hasDetails && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-stone-800 tracking-wide uppercase">
                Produktdetails
              </h3>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-0 divide-y divide-stone-100">
              {details.map((detail) => (
                <div
                  key={detail.label}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <span className="text-sm text-stone-500">{detail.label}</span>
                  <span className="text-sm font-medium text-stone-800">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Versand & Retouren Card */}
      <div className={`bg-white rounded-2xl border border-stone-200 overflow-hidden ${!hasDetails ? "medium:col-span-2 max-w-lg mx-auto w-full" : ""}`}>
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-stone-800 tracking-wide uppercase">
              Versand & Retouren
            </h3>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="space-y-5">
            <ShippingItem
              icon={<FastDelivery />}
              title="Lieferung"
              description="Etwa 2 Wochen — Versand innerhalb Österreichs, bequem zu Ihnen nach Hause."
            />
            <ShippingItem
              icon={<Refresh />}
              title="Einfacher Umtausch"
              description="Passt nicht? Wir tauschen unkompliziert."
            />
            <ShippingItem
              icon={<Back />}
              title="Unkomplizierte Retouren"
              description="Kostenlose Rücksendung innerhalb von 30 Tagen."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ShippingItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
        {icon}
      </div>
      <div className="min-w-0">
        <span className="text-sm font-medium text-stone-800 block">
          {title}
        </span>
        <span className="text-xs text-stone-500 leading-relaxed">
          {description}
        </span>
      </div>
    </div>
  )
}

export default ProductTabs
