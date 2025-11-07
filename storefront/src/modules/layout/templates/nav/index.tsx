import { listRegions } from "@lib/data/regions";
import { StoreRegion } from "@medusajs/types";
import LocalizedClientLink from "@modules/common/components/localized-client-link";
import CartButton from "@modules/layout/components/cart-button";
import SideMenu from "@modules/layout/components/side-menu";
import { getTranslations } from "next-intl/server";

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions);
  const t = await getTranslations("nav");

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base"> 
        {/* Textfarbe der Navigation auf dunklen Stein gesetzt */}
        <nav className="content-container text-sm text-stone-900 flex items-center justify-between w-full h-full"> 
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              // Serifen-Display-Schriftart für das Logo
              className="font-serif-display text-xl font-medium text-stone-900 hover:text-stone-700 uppercase tracking-wider transition-colors" 
              data-testid="nav-store-link"
            >
              Jutta Strickerei
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              {/* Nav-Links verwenden dunklen Text und Hover-Effekte */}
              <LocalizedClientLink
                href="/search"
                scroll={false}
                data-testid="nav-search-link"
                className="hover:text-stone-700 text-sm transition-colors" 
              >
                {t("search")}
              </LocalizedClientLink>

              <LocalizedClientLink
                href="/account"
                data-testid="nav-account-link"
                className="hover:text-stone-700 text-sm transition-colors" 
              >
                {t("account")}
              </LocalizedClientLink>
            </div>
            
            <CartButton />
          </div>
        </nav>
      </header>
    </div>
  );
}