import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Instagram, Facebook, Mail, Phone, MapPin } from "@components/icons"

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-stone-800 text-stone-300">
      {/* Main Footer */}
      <div className="content-container py-16 small:py-20">
        <div className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-4 gap-12 medium:gap-8">
          {/* Brand Column */}
          <div className="small:col-span-2 medium:col-span-1">
            <LocalizedClientLink href="/" className="inline-block mb-6 group">
              <div className="font-serif text-2xl font-medium text-white group-hover:text-stone-200 transition-colors">
                Strickerei Jutta
              </div>
              <div className="text-xs text-stone-500 tracking-[0.2em] uppercase mt-1">
                in 3. Generation
              </div>
            </LocalizedClientLink>
            
            <p className="text-sm text-stone-400 leading-relaxed mb-6 max-w-xs">
              Österreichische Handwerkskunst in dritter Generation. 
              Feinste Strickwaren aus Naturfasern, gefertigt mit 
              traditionellen Techniken und zeitlosem Design.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <a 
                href="tel:+4326862259" 
                className="flex items-center gap-3 text-sm text-stone-400 hover:text-white transition-colors"
              >
                <Phone size={16} />
                +43 2686 2259
              </a>
              <a 
                href="mailto:office@strickerei-jutta.at" 
                className="flex items-center gap-3 text-sm text-stone-400 hover:text-white transition-colors"
              >
                <Mail size={16} />
                office@strickerei-jutta.at
              </a>
              <div className="flex items-start gap-3 text-sm text-stone-400">
                <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                <span>Draßburg, Österreich</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-sm font-medium text-white uppercase tracking-wider mb-6">
              Shop
            </h4>
            <ul className="space-y-3">
              <li>
                <LocalizedClientLink
                  href="/store"
                  className="text-sm text-stone-400 hover:text-white transition-colors"
                >
                  Alle Produkte
                </LocalizedClientLink>
              </li>
              {collections?.slice(0, 5).map((collection) => (
                <li key={collection.id}>
                  <LocalizedClientLink
                    href={`/collections/${collection.handle}`}
                    className="text-sm text-stone-400 hover:text-white transition-colors"
                  >
                    {collection.title}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          {productCategories && productCategories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white uppercase tracking-wider mb-6">
                Kategorien
              </h4>
              <ul className="space-y-3">
                {productCategories
                  .filter((c) => !c.parent_category)
                  .slice(0, 6)
                  .map((category) => (
                    <li key={category.id}>
                      <LocalizedClientLink
                        href={`/categories/${category.handle}`}
                        className="text-sm text-stone-400 hover:text-white transition-colors"
                      >
                        {category.name}
                      </LocalizedClientLink>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Info Links */}
          <div>
            <h4 className="text-sm font-medium text-white uppercase tracking-wider mb-6">
              Informationen
            </h4>
            <ul className="space-y-3">
              <li>
                <LocalizedClientLink
                  href="/about"
                  className="text-sm text-stone-400 hover:text-white transition-colors"
                >
                  Über uns
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/contact"
                  className="text-sm text-stone-400 hover:text-white transition-colors"
                >
                  Kontakt
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/size-guide"
                  className="text-sm text-stone-400 hover:text-white transition-colors"
                >
                  Größenberatung
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/care"
                  className="text-sm text-stone-400 hover:text-white transition-colors"
                >
                  Pflegehinweise
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/shipping"
                  className="text-sm text-stone-400 hover:text-white transition-colors"
                >
                  Versand & Rückgabe
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/faq"
                  className="text-sm text-stone-400 hover:text-white transition-colors"
                >
                  FAQ
                </LocalizedClientLink>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-700">
        <div className="content-container py-6">
          <div className="flex flex-col small:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-stone-500 text-center small:text-left">
              © {currentYear} Strickerei Jutta. Alle Rechte vorbehalten.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-6 text-sm text-stone-500">
              <LocalizedClientLink
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Datenschutz
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/terms"
                className="hover:text-white transition-colors"
              >
                AGB
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/imprint"
                className="hover:text-white transition-colors"
              >
                Impressum
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
