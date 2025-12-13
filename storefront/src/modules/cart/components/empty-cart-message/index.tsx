import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import { ShoppingBag, ArrowRight } from "@components/icons"

const EmptyCartMessage = () => {
  return (
    <div 
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
      data-testid="empty-cart-message"
    >
      {/* Icon */}
      <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mb-6">
        <ShoppingBag size={40} className="text-stone-400" />
      </div>

      {/* Text */}
      <h2 className="font-serif text-2xl font-medium text-stone-800 mb-3">
        Ihr Warenkorb ist leer
      </h2>
      <p className="text-stone-600 max-w-md mb-8">
        Sie haben noch keine Artikel in Ihrem Warenkorb. 
        Entdecken Sie unsere handgefertigten Strickwaren und finden Sie Ihr Lieblingsstück.
      </p>

      {/* CTA */}
      <LocalizedClientLink href="/store">
        <Button size="lg">
          Kollektion entdecken
          <ArrowRight size={18} className="ml-2" />
        </Button>
      </LocalizedClientLink>

      {/* Additional Links */}
      <div className="mt-8 flex items-center gap-6 text-sm">
        <LocalizedClientLink 
          href="/"
          className="text-stone-600 hover:text-stone-800 transition-colors underline underline-offset-4"
        >
          Zur Startseite
        </LocalizedClientLink>
        <LocalizedClientLink 
          href="/contact"
          className="text-stone-600 hover:text-stone-800 transition-colors underline underline-offset-4"
        >
          Hilfe & Kontakt
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
