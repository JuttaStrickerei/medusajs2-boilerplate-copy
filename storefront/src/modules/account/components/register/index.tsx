"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"
import { UserPlus } from "@components/icons"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8"
      data-testid="register-page"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <UserPlus size={28} className="text-stone-600" />
        </div>
        <h1 className="font-serif text-2xl font-medium text-stone-800 mb-2">
          Konto erstellen
        </h1>
        <p className="text-stone-600">
          Werden Sie Teil der Strickerei Jutta Familie
        </p>
      </div>

      {/* Form */}
      <form className="space-y-4" action={formAction}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Vorname"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Nachname"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
        </div>
        
        <Input
          label="E-Mail Adresse"
          name="email"
          required
          type="email"
          autoComplete="email"
          data-testid="email-input"
        />
        
        <Input
          label="Telefon (optional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          data-testid="phone-input"
        />
        
        <Input
          label="Passwort"
          name="password"
          required
          type="password"
          autoComplete="new-password"
          data-testid="password-input"
        />

        <ErrorMessage error={message} data-testid="register-error" />

        {/* Terms */}
        <p className="text-xs text-stone-500 text-center">
          Mit der Registrierung akzeptieren Sie unsere{" "}
          <LocalizedClientLink
            href="/datenschutz"
            className="text-stone-700 underline underline-offset-2"
          >
            Datenschutzerklärung
          </LocalizedClientLink>{" "}
          und{" "}
          <LocalizedClientLink
            href="/agb"
            className="text-stone-700 underline underline-offset-2"
          >
            AGB
          </LocalizedClientLink>
          .
        </p>

        <SubmitButton 
          className="w-full h-12 text-base" 
          data-testid="register-button"
        >
          Registrieren
        </SubmitButton>
      </form>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-stone-200 text-center">
        <p className="text-sm text-stone-600">
          Bereits ein Konto?{" "}
          <button
            onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
            className="font-medium text-stone-800 hover:underline"
          >
            Jetzt anmelden
          </button>
        </p>
      </div>
    </div>
  )
}

export default Register
