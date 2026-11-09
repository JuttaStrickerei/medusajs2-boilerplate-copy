"use client"

import { useActionState } from "react"
import { resetPassword, type PasswordFormState } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@medusajs/ui"
import { Check, Lock } from "@components/icons"
import ForgotPassword from "@modules/account/components/forgot-password"

type Props = {
  // Gibt es ein gültiges Token aus dem Mail-Link?
  tokenValid: boolean
  // Aus dem Token gelesen, nur zur Anzeige und für den Passwort-Manager
  email: string | null
}

const initialState: PasswordFormState = { success: false, error: null }

// Alle drei Zustände in einer Komponente: Nach dem Speichern löscht die
// Server-Action das Token-Cookie und die Seite wird neu aufgebaut (dann ohne
// Token). Der Erfolg steckt hier im Zustand und bleibt so sichtbar.
const ResetPassword = ({ tokenValid, email }: Props) => {
  const [state, formAction] = useActionState(resetPassword, initialState)

  if (!state.success && !tokenValid) {
    return (
      <ForgotPassword
        title="Der Link ist abgelaufen"
        intro="Aus Sicherheitsgründen gilt der Link nur 15 Minuten. Geben Sie Ihre E-Mail-Adresse ein, dann schicken wir Ihnen einen neuen."
      />
    )
  }

  if (state.success) {
    return (
      <div
        className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center"
        data-testid="reset-password-success"
      >
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <Check size={28} className="text-stone-600" />
        </div>
        <h1 className="font-serif text-2xl font-medium text-stone-800 mb-2">
          Ihr Passwort ist geändert
        </h1>
        <p className="text-stone-600 mb-8">
          Sie können sich jetzt mit Ihrem neuen Passwort anmelden.
        </p>
        <LocalizedClientLink href="/account" className="block">
          <Button className="w-full h-12 text-base">Zur Anmeldung</Button>
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8"
      data-testid="reset-password-page"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-stone-600" />
        </div>
        <h1 className="font-serif text-2xl font-medium text-stone-800 mb-2">
          Neues Passwort festlegen
        </h1>
        <p className="text-stone-600">
          {email ? (
            <>
              Für Ihr Konto <span className="font-medium">{email}</span>
            </>
          ) : (
            "Bitte geben Sie Ihr neues Passwort zweimal ein."
          )}
        </p>
      </div>

      <form className="space-y-4" action={formAction}>
        {/* Für Passwort-Manager: so speichern sie das neue Passwort zum
            richtigen Konto */}
        {email && (
          <input
            type="email"
            name="username"
            autoComplete="username"
            value={email}
            readOnly
            hidden
          />
        )}
        <Input
          label="Neues Passwort"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          data-testid="reset-password-input"
        />
        <Input
          label="Neues Passwort wiederholen"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          required
          data-testid="reset-password-confirm-input"
        />

        <ErrorMessage error={state.error} data-testid="reset-password-error" />

        <SubmitButton
          data-testid="reset-password-submit"
          className="w-full h-12 text-base"
        >
          Passwort speichern
        </SubmitButton>
      </form>
    </div>
  )
}

export default ResetPassword
