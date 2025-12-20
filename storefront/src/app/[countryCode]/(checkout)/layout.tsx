import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowLeft, Shield, Lock } from "@components/icons"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-stone-50 relative min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
        <nav className="flex h-16 items-center content-container justify-between">
          {/* Back Link */}
          <LocalizedClientLink
            href="/cart"
            className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium hidden small:block">
              Zurück zum Warenkorb
            </span>
            <span className="text-sm font-medium small:hidden">
              Zurück
            </span>
          </LocalizedClientLink>
          
          {/* Logo */}
          <LocalizedClientLink
            href="/"
            className="text-center group"
            data-testid="store-link"
          >
            <div className="font-serif text-xl small:text-2xl font-medium text-stone-800 tracking-tight group-hover:text-stone-600 transition-colors">
              Strickerei Jutta
            </div>
            <div className="text-[10px] small:text-xs text-stone-500 tracking-[0.2em] uppercase">
              seit 1965
            </div>
          </LocalizedClientLink>
          
          {/* Security Badges */}
          <div className="flex items-center justify-end gap-3 flex-1 basis-0">
            <div className="hidden small:flex items-center gap-1.5 text-xs text-stone-500">
              <Lock size={14} />
              <span>SSL</span>
            </div>
            <div className="hidden small:flex items-center gap-1.5 text-xs text-stone-500">
              <Shield size={14} />
              <span>Sicher</span>
            </div>
          </div>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="relative" data-testid="checkout-container">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="py-6 border-t border-stone-200 bg-white">
        <div className="content-container">
          <div className="flex flex-col small:flex-row items-center justify-between gap-4 text-sm text-stone-500">
            <p>© {new Date().getFullYear()} Strickerei Jutta. Alle Rechte vorbehalten.</p>
            <div className="flex items-center gap-6">
              <LocalizedClientLink href="/datenschutz" className="hover:text-stone-800 transition-colors">
                Datenschutz
              </LocalizedClientLink>
              <LocalizedClientLink href="/agb" className="hover:text-stone-800 transition-colors">
                AGB
              </LocalizedClientLink>
              <LocalizedClientLink href="/impressum" className="hover:text-stone-800 transition-colors">
                Impressum
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
