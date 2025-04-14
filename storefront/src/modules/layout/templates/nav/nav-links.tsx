'use client';

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ClientLanguageSwitcher from "../../../../i18n/components/ClientLanguageSwitcher"
import { useLanguage } from "../../../../i18n/LanguageContext"

export default function NavLinks() {
  const { t } = useLanguage()
  
  return (
    <div className="hidden small:flex items-center gap-x-6 h-full">
      <div className="hover:text-ui-fg-base">
        <ClientLanguageSwitcher />
      </div>
      
      <LocalizedClientLink
        className="hover:text-ui-fg-base"
        href="/search"
        scroll={false}
        data-testid="nav-search-link"
      >
        {t('nav.search')}
      </LocalizedClientLink>
      
      <LocalizedClientLink
        className="hover:text-ui-fg-base"
        href="/account"
        data-testid="nav-account-link"
      >
        {t('nav.account')}
      </LocalizedClientLink>
    </div>
  )
}