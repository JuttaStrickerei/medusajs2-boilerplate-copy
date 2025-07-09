import { useFormState } from "react-dom"

import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { login } from "@lib/data/customer"
import { useTranslations } from "next-intl" // Already imported, good!

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(login, null)
  const t = useTranslations("account") // Already initialized, good!

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="text-large-semi uppercase mb-6">{t("welcome_back")}</h1> {/* <--- ÜBERSETZT */}
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        {t("login_description")} {/* <--- ÜBERSETZT */}
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label={t("email")} // <--- ÜBERSETZT (key reused from previous steps)
            name="email"
            type="email"
            title={t("email_input_title")} // <--- ÜBERSETZT
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label={t("password")} // <--- ÜBERSETZT (key reused from previous steps)
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          {t("sign_in_button")} {/* <--- ÜBERSETZT (key reused from Register component) */}
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        {t("not_member_question")}{" "} {/* <--- ÜBERSETZT */}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          {t("join_button")} {/* <--- ÜBERSETZT (key reused from Register component) */}
        </button>
        .
      </span>
    </div>
  )
}

export default Login