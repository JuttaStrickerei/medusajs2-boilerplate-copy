"use client"

import { useFormState } from "react-dom"
import { useTranslations } from "next-intl" // <--- DIESEN IMPORT HINZUFÜGEN

import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(signup, null)
  const t = useTranslations('register') // <--- DIESE ZEILE HINZUFÜGEN (oder 'account', je nach Ihrer Wahl)

  return (
    <div
      className="max-w-sm flex flex-col items-center"
      data-testid="register-page"
    >
      <h1 className="text-large-semi uppercase mb-6">
        {t("title")} {/* <--- ÜBERSETZT */}
      </h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-4">
        {t("description")} {/* <--- ÜBERSETZT */}
      </p>
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label={t("first_name")} // <--- ÜBERSETZT
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label={t("last_name")} // <--- ÜBERSETZT
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label={t("email")} // <--- ÜBERSETZT
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label={t("phone")} // <--- ÜBERSETZT
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label={t("password")} // <--- ÜBERSETZT
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="register-error" />
        <span className="text-center text-ui-fg-base text-small-regular mt-6">
          {t("agreement_part1")} {/* <--- ÜBERSETZT */}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="underline"
          >
            {t("agreement_privacy_policy")} {/* <--- ÜBERSETZT */}
          </LocalizedClientLink>{" "}
          {t("agreement_and")} {/* <--- ÜBERSETZT */}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="underline"
          >
            {t("agreement_terms_of_use")} {/* <--- ÜBERSETZT */}
          </LocalizedClientLink>
          .
        </span>
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          {t("join_button")} {/* <--- ÜBERSETZT */}
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        {t("already_member_question")}{" "} {/* <--- ÜBERSETZT */}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
        >
          {t("sign_in_button")} {/* <--- ÜBERSETZT */}
        </button>
        .
      </span>
    </div>
  )
}

export default Register