"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const hasProductInfo = !!(
    product.material ||
    product.origin_country ||
    product.type?.value ||
    product.weight ||
    (product.length && product.width && product.height)
  )

  const tabs = [
    ...(hasProductInfo
      ? [
          {
            label: "Produktdetails",
            component: <ProductInfoTab product={product} />,
          },
        ]
      : []),
    {
      label: "Versand & Retouren",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Accordion type="multiple" defaultValue={hasProductInfo ? ["Produktdetails"] : []}>
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

type ProductDetailRow = {
  label: string
  value: string
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const details: ProductDetailRow[] = []

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

  if (details.length === 0) return null

  return (
    <div className="py-6">
      <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="flex items-baseline justify-between small:flex-col small:items-start gap-1 py-3 border-b border-stone-100 last:border-b-0"
          >
            <span className="text-sm text-stone-500">{detail.label}</span>
            <span className="text-sm font-medium text-stone-800">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="py-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
            <FastDelivery />
          </div>
          <div>
            <span className="text-sm font-semibold text-stone-800 block mb-1">
              Schnelle Lieferung
            </span>
            <p className="text-sm text-stone-600 leading-relaxed max-w-md">
              Ihr Paket erreicht Sie innerhalb von 3–5 Werktagen — bequem zu
              Ihnen nach Hause oder an Ihre Wunschadresse.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
            <Refresh />
          </div>
          <div>
            <span className="text-sm font-semibold text-stone-800 block mb-1">
              Einfacher Umtausch
            </span>
            <p className="text-sm text-stone-600 leading-relaxed max-w-md">
              Passt die Größe nicht ganz? Kein Problem — wir tauschen Ihr
              Produkt unkompliziert gegen ein neues.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
            <Back />
          </div>
          <div>
            <span className="text-sm font-semibold text-stone-800 block mb-1">
              Unkomplizierte Retouren
            </span>
            <p className="text-sm text-stone-600 leading-relaxed max-w-md">
              Senden Sie Ihr Produkt einfach zurück und wir erstatten Ihnen den
              Kaufpreis. Ohne Wenn und Aber — wir machen Ihnen die Rückgabe so
              einfach wie möglich.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
