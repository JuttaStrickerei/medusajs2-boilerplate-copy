"use client"

import { clx } from "@medusajs/ui"
import { useParams, usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"
import { useCart } from "@lib/context/cart-context"
import { 
  User, 
  MapPin, 
  Package, 
  LogOut, 
  ChevronRight,
  LayoutGrid
} from "@components/icons"

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }
  const { clearCart } = useCart()

  const handleLogout = async () => {
    // FIX: Clear client cart state immediately so navbar count doesn't stay stale after logout.
    clearCart()
    await signout(countryCode)
  }

  const navItems = [
    { href: "/account", label: "Übersicht", icon: LayoutGrid, testId: "overview-link" },
    { href: "/account/profile", label: "Profil", icon: User, testId: "profile-link" },
    { href: "/account/addresses", label: "Adressen", icon: MapPin, testId: "addresses-link" },
    { href: "/account/orders", label: "Bestellungen", icon: Package, testId: "orders-link" },
  ]

  return (
    <div>
      {/* Mobile Navigation */}
      <div className="small:hidden" data-testid="mobile-account-nav">
        {route !== `/${countryCode}/account` ? (
          <LocalizedClientLink
            href="/account"
            className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors py-4"
            data-testid="account-main-link"
          >
            <ChevronRight size={18} className="rotate-180" />
            <span className="font-medium">Mein Konto</span>
          </LocalizedClientLink>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <LocalizedClientLink
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between p-4 border-b border-stone-100 last:border-b-0 hover:bg-stone-50 transition-colors"
                  data-testid={item.testId}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className="text-stone-500" />
                    <span className="font-medium text-stone-800">{item.label}</span>
                  </div>
                  <ChevronRight size={18} className="text-stone-400" />
                </LocalizedClientLink>
              )
            })}
            <button
              type="button"
              className="flex items-center justify-between p-4 w-full hover:bg-stone-50 transition-colors text-left"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <div className="flex items-center gap-3">
                <LogOut size={20} className="text-stone-500" />
                <span className="font-medium text-stone-800">Abmelden</span>
              </div>
              <ChevronRight size={18} className="text-stone-400" />
            </button>
          </div>
        )}
      </div>

      {/* Desktop Navigation */}
      <div className="hidden small:block" data-testid="account-nav">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {/* User Info */}
          {customer && (
            <div className="p-4 border-b border-stone-200 bg-stone-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
                  <User size={20} className="text-stone-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-stone-800 truncate">
                    {customer.first_name} {customer.last_name}
                  </p>
                  <p className="text-sm text-stone-500 truncate">
                    {customer.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Nav Items */}
          <nav className="p-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = route.split(countryCode)[1] === item.href
              
              return (
                <LocalizedClientLink
                  key={item.href}
                  href={item.href}
                  className={clx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    {
                      "bg-stone-100 text-stone-800": isActive,
                      "text-stone-600 hover:bg-stone-50 hover:text-stone-800": !isActive,
                    }
                  )}
                  data-testid={item.testId}
                >
                  <Icon size={18} />
                  <span className={clx("text-sm", { "font-medium": isActive })}>
                    {item.label}
                  </span>
                </LocalizedClientLink>
              )
            })}

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors mt-2 border-t border-stone-100 pt-4"
              data-testid="logout-button"
            >
              <LogOut size={18} />
              <span className="text-sm">Abmelden</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default AccountNav
