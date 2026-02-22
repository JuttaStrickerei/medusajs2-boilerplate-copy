import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { ChevronRight, User, MapPin, Package } from "@components/icons"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  return (
    <div data-testid="overview-page-wrapper" className="p-6 small:p-8">
      {/* Welcome Header */}
      <div className="flex flex-col small:flex-row small:items-center small:justify-between gap-4 mb-8 pb-6 border-b border-stone-200">
        <div>
          <h2 
            className="font-serif text-2xl font-medium text-stone-800"
            data-testid="welcome-message" 
            data-value={customer?.first_name}
          >
            Hallo {customer?.first_name}
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Willkommen in Ihrem Konto
          </p>
        </div>
        <div className="text-sm text-stone-600">
          Angemeldet mit:{" "}
          <span
            className="font-medium text-stone-800"
            data-testid="customer-email"
            data-value={customer?.email}
          >
            {customer?.email}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 small:grid-cols-2 gap-4 mb-8">
        {/* Profile Completion */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-stone-200">
              <User size={20} className="text-stone-600" />
            </div>
            <h3 className="font-medium text-stone-800">Profil</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl font-semibold text-stone-800"
              data-testid="customer-profile-completion"
              data-value={getProfileCompletion(customer)}
            >
              {getProfileCompletion(customer)}%
            </span>
            <span className="text-sm text-stone-500">
              vollständig
            </span>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-stone-200">
              <MapPin size={20} className="text-stone-600" />
            </div>
            <h3 className="font-medium text-stone-800">Adressen</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl font-semibold text-stone-800"
              data-testid="addresses-count"
              data-value={customer?.addresses?.length || 0}
            >
              {customer?.addresses?.length || 0}
            </span>
            <span className="text-sm text-stone-500">
              gespeichert
            </span>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Package size={20} className="text-stone-600" />
          <h3 className="font-serif text-lg font-medium text-stone-800">
            Letzte Bestellungen
          </h3>
        </div>
        
        <div
          className="space-y-3"
          data-testid="orders-wrapper"
        >
          {orders && orders.length > 0 ? (
            orders.slice(0, 5).map((order) => (
              <LocalizedClientLink
                key={order.id}
                href={`/account/orders/details/${order.id}`}
                data-testid="order-wrapper"
                data-value={order.id}
                className="block"
              >
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-3 gap-6 flex-1">
                      <div>
                        <p className="text-xs text-stone-500 mb-1">Bestelldatum</p>
                        <p className="text-sm font-medium text-stone-800" data-testid="order-created-date">
                          {new Date(order.created_at).toLocaleDateString("de-AT", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 mb-1">Bestellnummer</p>
                        <p 
                          className="text-sm font-medium text-stone-800"
                          data-testid="order-id"
                          data-value={order.display_id}
                        >
                          #{order.display_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 mb-1">Gesamtsumme</p>
                        <p className="text-sm font-medium text-stone-800" data-testid="order-amount">
                          {convertToLocale({
                            amount: order.total,
                            currency_code: order.currency_code,
                          })}
                        </p>
                      </div>
                    </div>
                    <ChevronRight 
                      size={20} 
                      className="text-stone-400 group-hover:text-stone-600 group-hover:translate-x-1 transition-all"
                      data-testid="open-order-button"
                    />
                  </div>
                </div>
              </LocalizedClientLink>
            ))
          ) : (
            <div className="text-center py-8 text-stone-500" data-testid="no-orders-message">
              <Package size={40} className="mx-auto mb-3 text-stone-300" />
              <p>Noch keine Bestellungen</p>
              <LocalizedClientLink 
                href="/store" 
                className="text-stone-800 underline underline-offset-4 text-sm mt-2 inline-block hover:text-stone-600"
              >
                Jetzt shoppen
              </LocalizedClientLink>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
