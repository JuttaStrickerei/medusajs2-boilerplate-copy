"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

import { useLanguage } from "../../../../i18n/LanguageContext"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}


const ProductTabs = ({ product }: ProductTabsProps) => {

  const {t} = useLanguage()

  const tabs = [
    {
      label: t('product.productinformation'),
      component: <ProductInfoTab product={product} />,
    },
    {
      label: t('product.shipping_return'),
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
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

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const {t} = useLanguage()
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">{t('productinformation.material')}</span>
            <p>{product.material ? product.material : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">{t('productinformation.origincountry')}</span>
            <p>{product.origin_country ? product.origin_country : "-"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">{t('productinformation.weight')}</span>
            <p>{product.weight ? `${product.weight} g` : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">{t('productinformation.dimensions')}</span>
            <p>
              {product.length && product.width && product.height
                ? `${product.length}L x ${product.width}W x ${product.height}H`
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  const {t} = useLanguage()
  return (
    
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">{t('product.fastdelivery')}</span>
            <p className="max-w-sm">
              {t('product.shipping_returninfo')}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">{t('product.exchange')}</span>
            <p className="max-w-sm">
              {t('product.exchangeinfo')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
