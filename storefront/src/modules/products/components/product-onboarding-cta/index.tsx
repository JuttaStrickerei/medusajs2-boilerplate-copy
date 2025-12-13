import { Button } from "@components/ui"
import { CheckCircle } from "@components/icons"
import { cookies as nextCookies } from "next/headers"

async function ProductOnboardingCta() {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  if (!isOnboarding) {
    return null
  }

  return (
    <div className="max-w-4xl w-full bg-green-50 border border-green-200 rounded-xl p-6">
      <div className="flex flex-col gap-y-4 items-center text-center">
        <CheckCircle size={32} className="text-green-600" />
        <h2 className="text-lg font-medium text-stone-800">
          Ihr Demo-Produkt wurde erfolgreich erstellt! 🎉
        </h2>
        <p className="text-sm text-stone-600">
          Sie können jetzt mit der Einrichtung Ihres Shops im Admin-Bereich fortfahren.
        </p>
        <a href="http://localhost:7001/a/orders?onboarding_step=create_order_nextjs">
          <Button className="w-full">Einrichtung im Admin fortsetzen</Button>
        </a>
      </div>
    </div>
  )
}

export default ProductOnboardingCta
