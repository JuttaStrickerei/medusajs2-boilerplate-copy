import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"
import { HelpCircle, ArrowRight } from "@components/icons"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  // If not logged in, render children (LoginTemplate) without sidebar
  if (!customer) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="account-page">
      {/* Page Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="content-container py-8 small:py-12">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-serif text-3xl small:text-4xl font-medium text-stone-800 mb-2">
              Mein Konto
            </h1>
            <p className="text-stone-600">
              Willkommen zurück, {customer.first_name}!
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-container py-8 small:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 small:grid-cols-[260px_1fr] gap-8">
            {/* Sidebar */}
            <aside className="small:sticky small:top-24 small:self-start">
              <AccountNav customer={customer} />
            </aside>

            {/* Content */}
            <main className="min-w-0">
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
                {children}
              </div>
            </main>
          </div>

          {/* Help Section */}
          <div className="mt-12 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 small:p-8">
            <div className="flex flex-col small:flex-row items-start small:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <HelpCircle size={24} className="text-stone-600" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-stone-800 mb-1">
                    Haben Sie Fragen?
                  </h3>
                  <p className="text-stone-600">
                    Besuchen Sie unseren Kundenservice für häufig gestellte Fragen und Antworten.
                  </p>
                </div>
              </div>
              <LocalizedClientLink
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors font-medium"
              >
                Kontakt
                <ArrowRight size={18} />
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
