import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import InteractiveLink from "@modules/common/components/interactive-link"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("not_found")

  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function NotFound() {
  const t = await getTranslations("not_found")

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">{t("page_not_found")}</h1>
      <p className="text-small-regular text-ui-fg-base">
        {t("cart_not_found")}
      </p>
      <InteractiveLink href="/">{t("go_to_frontpage")}</InteractiveLink>
    </div>
  )
}
