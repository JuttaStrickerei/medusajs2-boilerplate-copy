"use client"

import { resetOnboardingState } from "@lib/data/onboarding"
import { Button } from "@components/ui"
import { CheckCircle } from "@components/icons"

const OnboardingCta = ({ orderId }: { orderId: string }) => {
  return (
    <div className="max-w-4xl w-full bg-green-50 border border-green-200 rounded-xl p-6">
      <div className="flex flex-col gap-y-4 items-center text-center">
        <CheckCircle size={32} className="text-green-600" />
        <h2 className="text-lg font-medium text-stone-800">
          Ihre Testbestellung wurde erfolgreich erstellt! 🎉
        </h2>
        <p className="text-sm text-stone-600">
          Sie können jetzt die Einrichtung Ihres Shops im Admin-Bereich abschließen.
        </p>
        <Button
          className="w-fit"
          onClick={() => resetOnboardingState(orderId)}
        >
          Einrichtung im Admin abschließen
        </Button>
      </div>
    </div>
  )
}

export default OnboardingCta
