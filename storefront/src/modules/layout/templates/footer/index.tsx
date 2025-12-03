import { getCategoriesList } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import { Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MedusaCTA from "@modules/layout/components/medusa-cta"
import { getTranslations } from "next-intl/server" 

export default async function Footer() {
  const { collections } = await getCollectionsList(0, 6)
  const { product_categories } = await getCategoriesList(0, 6)
  const t = await getTranslations("Footer") 

  return (
    // Hintergrundfarbe auf dunklen Stein, Textfarbe hell und Border angepasst
    <footer className="bg-stone-800 border-t border-stone-700 w-full text-stone-300">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-12 xsmall:flex-row items-start justify-between py-16 md:py-24">
          
          {/* Brand Name Section */}
          <div>
            <LocalizedClientLink
              href="/"
              // Serifen-Display-Schriftart, größer und weiß
              className="font-serif-display text-2xl font-medium text-white hover:text-white uppercase tracking-wider" 
            >
              Jutta Strickerei
            </LocalizedClientLink>

            <div className="mt-2">
              <a
                href="https://strickerei-jutta.at/"
                target="_blank"
                rel="noopener noreferrer"
                // Textfarbe angepasst
                className="text-stone-400 hover:text-white text-sm transition-colors" 
              >
                {t("back_to_homepage")}
              </a>
            </div>
          </div>
          
          {/* Navigation Links Section */}
          <div className="text-sm gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {product_categories && product_categories?.length > 0 && (
              <div className="flex flex-col gap-y-3">
                {/* Überschriften in Weiß, fett und uppercase */}
                <span className="text-white font-medium mb-1 uppercase tracking-wider text-xs">
                  {t("categories")}
                </span>
                <ul
                  className="grid grid-cols-1 gap-2 text-stone-400"
                  data-testid="footer-categories"
                >
                  {product_categories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return
                    }

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null

                    return (
                      <li
                        className="flex flex-col gap-2 text-stone-400 text-sm"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "hover:text-white transition-colors", // Hover-Effekt auf Weiß
                            children && "font-medium"
                          )}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children &&
                              children.map((child) => (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    className="hover:text-white transition-colors"
                                    href={`/categories/${child.handle}`}
                                    data-testid="category-link"
                                  >
                                    {child.name}
                                  </LocalizedClientLink>
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-3">
                <span className="text-white font-medium mb-1 uppercase tracking-wider text-xs">
                  {t("collections")}
                </span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-stone-400 text-sm",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-white transition-colors"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Informations Links */}
            <div className="flex flex-col gap-y-3">
              <span className="text-white font-medium mb-1 uppercase tracking-wider text-xs">{t("informations")}</span>
              <ul className="grid grid-cols-1 gap-y-2 text-stone-400 text-sm">
                <li>
                  <LocalizedClientLink
                    href="/ueber-uns/"
                    className="hover:text-white transition-colors"
                  >
                    {t("about_us")}
                  </LocalizedClientLink>
                </li>

                <li>
                  <LocalizedClientLink
                    href="/impressum/"
                    className="hover:text-white transition-colors"
                  >
                    {t("impressum")}
                  </LocalizedClientLink>
                </li>

                <li>
                  <LocalizedClientLink
                    href="/terms_services/"
                    className="hover:text-white transition-colors"
                  >
                    {t("terms_services")}
                  </LocalizedClientLink>
                </li>

                <li>
                  <LocalizedClientLink
                    href="/privacy_policy/"
                    className="hover:text-white transition-colors"
                  >
                    {t("privacy_policy")}
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Copyright Section */}
        <div className="flex w-full mb-8 pt-8 border-t border-stone-700 justify-between text-stone-400">
          <Text className="text-xs">
            © {new Date().getFullYear()} Jutta Strickerei
          </Text>
          <MedusaCTA />
        </div>
      </div>
    </footer>
  )
}