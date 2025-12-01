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
      <header className="relative h-16 mx-auto border-b duration-200 bg-white/95 backdrop-blur-sm border-stone-200">
        <nav className="content-container text-sm text-stone-600 flex items-center justify-between w-full h-full">
          {/* Left Navigation */}
          <div className="flex-1 basis-0 h-full flex items-center">
            <SideMenu regions={regions} />
          </div>

          {/* Center Logo */}
          <div className="flex flex-col items-center h-full justify-center">
            <LocalizedClientLink
              href="/"
              className="text-center"
              data-testid="nav-store-link"
            >
              <div className="font-serif text-xl font-medium text-stone-800">
                Strickerei Jutta
              </div>
              <div className="text-xs text-stone-500 tracking-wider">
                SEIT 1965
              </div>
            </LocalizedClientLink>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              {/* Search Link */}
              <LocalizedClientLink
                href="/search"
                scroll={false}
                data-testid="nav-search-link"
                className="nav-link text-sm font-medium text-stone-600"
              >
                {t("search")}
              </LocalizedClientLink>

              {/* Account Link */}
              <LocalizedClientLink
                href="/account"
                data-testid="nav-account-link"
                className="nav-link text-sm font-medium text-stone-600"
              >
                {t("account")}
              </LocalizedClientLink>
            </div>

            {/* Cart Button (always visible) */}
            <CartButton />
          </div>
        </nav>
      </header>
    </div>
  );
}
