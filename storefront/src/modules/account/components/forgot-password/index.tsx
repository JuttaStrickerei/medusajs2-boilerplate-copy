"use client"

import { useActionState } from "react"
import { requestPasswordReset, type PasswordFormState } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { Lock } from "@components/icons"

type Props = {
  // Zurück zur Anmeldung (fehlt, wenn das Formular auf der Seite
  // „Link abgelaufen“ steht)
  onBack?: () => void
  title?: string
  intro?: string
}

const initialState: PasswordFormState = { success: false, error: null }

const ForgotPassword = ({
  onBack,
  title = "Passwort vergessen?",
  intro = "Geben Sie die E-Mail-Adresse Ihres Kontos ein. Wir schicken Ihnen einen Link, mit dem Sie ein neues Passwort festlegen.",
}: Props) => {
  const [state, formAction] = useActionState(requestPasswordReset, initialState)

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8"
      data-testid="forgot-password-page"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-stone-600" />
        </div>
        <h1 className="font-serif text-2xl font-medium text-stone-800 mb-2">
          {state.success ? "Bitte sehen Sie in Ihr Postfach" : title}
        </h1>
        {!state.success && <p className="text-stone-600">{intro}</p>}
      </div>

      {state.success ? (
        <div
          className="space-y-4 text-stone-700 leading-relaxed"
          data-testid="forgot-password-success"
        >
          <p>
            Wenn es zu dieser E-Mail-Adresse ein Konto gibt, haben wir Ihnen
            gerade einen Link geschickt. Der Link ist 15 Minuten gültig.
          </p>
          <p className="text-sm text-stone-600">
            Keine E-Mail bekommen? Sehen Sie bitte auch im Spam-Ordner nach
            oder fordern Sie den Link noch einmal an. Wir helfen Ihnen auch
            gerne telefonisch: +43 2686 2259.
          </p>
        </div>
      ) : (
        <form className="space-y-4" action={formAction}>
          <Input
            label="E-Mail Adresse"
            name="email"
            type="email"
            title="Geben Sie eine gültige E-Mail Adresse ein"
            autoComplete="email"
            required
            data-testid="forgot-password-email-input"
          />

          <ErrorMessage
            error={state.error}
            data-testid="forgot-password-error"
          />

          <SubmitButton
            data-testid="forgot-password-submit"
            className="w-full h-12 text-base"
          >
            Link anfordern
          </SubmitButton>
        </form>
      )}

      {onBack && (
        <div className="mt-6 pt-6 border-t border-stone-200 text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-stone-800 hover:underline"
            data-testid="forgot-password-back"
          >
            Zurück zur Anmeldung
          </button>
        </div>
      )}
    </div>
  )
}

export default ForgotPassword
