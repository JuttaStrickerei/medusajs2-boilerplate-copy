import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"
import { User } from "@components/icons"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8"
      data-testid="login-page"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <User size={28} className="text-stone-600" />
        </div>
        <h1 className="font-serif text-2xl font-medium text-stone-800 mb-2">
          Willkommen zurück
        </h1>
        <p className="text-stone-600">
          Melden Sie sich an, um fortzufahren
        </p>
      </div>

      {/* Form */}
      <form className="space-y-4" action={formAction}>
        <div className="space-y-4">
          <Input
            label="E-Mail Adresse"
            name="email"
            type="email"
            title="Geben Sie eine gültige E-Mail Adresse ein"
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Passwort"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>

        <ErrorMessage error={message} data-testid="login-error-message" />

        <SubmitButton 
          data-testid="sign-in-button" 
          className="w-full h-12 text-base"
        >
          Anmelden
        </SubmitButton>
      </form>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-stone-200 text-center">
        <p className="text-sm text-stone-600">
          Noch kein Konto?{" "}
          <button
            onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
            className="font-medium text-stone-800 hover:underline"
            data-testid="register-button"
          >
            Jetzt registrieren
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
