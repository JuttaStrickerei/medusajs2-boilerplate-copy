"use client"

import { useEffect, useRef, useState } from "react"
import { sdk } from "@lib/config"

type Scope = "full" | "partial"
type Step = "form" | "review" | "success"
type FieldName = "name" | "orderReference" | "email" | "partialText"

type Values = {
  name: string
  orderReference: string
  email: string
  scope: Scope
  partialText: string
}

type SubmitResult = {
  success: boolean
  reference?: string
  received_at_formatted?: string
  confirmation_sent?: boolean
}

const FIELD_LABELS: Record<FieldName, string> = {
  name: "Vor- und Nachname",
  orderReference: "Bestell- oder Rechnungsnummer",
  email: "E-Mail-Adresse für die Eingangsbestätigung",
  partialText: "Welche Artikel möchten Sie widerrufen?",
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mirrors buildDeclarationText in backend/src/modules/revocation/utils.ts
const buildDeclarationText = (v: Values) => {
  const subject =
    v.scope === "full"
      ? `über sämtliche Waren der Bestellung ${v.orderReference.trim()}`
      : `über folgende Waren der Bestellung ${v.orderReference.trim()}: ${v.partialText.trim()}`
  return `Hiermit widerrufe ich, ${v.name.trim()}, den von mir abgeschlossenen Vertrag ${subject}.`
}

const validate = (v: Values) => {
  const errors: Partial<Record<FieldName, string>> = {}
  if (!v.name.trim()) errors.name = "Bitte geben Sie Ihren Namen an."
  if (!v.orderReference.trim())
    errors.orderReference = "Bitte geben Sie Ihre Bestell- oder Rechnungsnummer an."
  if (!v.email.trim()) errors.email = "Bitte geben Sie Ihre E-Mail-Adresse an."
  else if (!EMAIL_PATTERN.test(v.email.trim()))
    errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse an, z. B. name@beispiel.at."
  if (v.scope === "partial" && !v.partialText.trim())
    errors.partialText = "Bitte beschreiben Sie, welche Artikel Sie widerrufen möchten."
  return errors
}

const inputClass = (hasError: boolean) =>
  `w-full px-4 py-3 text-base border rounded-lg outline-none focus:ring-2 ${
    hasError
      ? "border-red-700 focus:border-red-700 focus:ring-red-700/20"
      : "border-stone-400 focus:border-stone-800 focus:ring-stone-800/20"
  }`

export default function RevocationForm() {
  const [step, setStep] = useState<Step>("form")
  const [values, setValues] = useState<Values>({
    name: "",
    orderReference: "",
    email: "",
    scope: "full",
    partialText: "",
  })
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [result, setResult] = useState<SubmitResult | null>(null)
  const honeypotRef = useRef<HTMLInputElement>(null)
  // Captured on "Weiter", because the honeypot input unmounts in step 2
  const honeypotValue = useRef("")

  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  // Incremented on every failed "Weiter" so the summary gets focus after render
  const [failedAttempts, setFailedAttempts] = useState(0)

  // Move focus to the new step's heading so screen readers announce it, and
  // scroll it into view (the new step is shorter than the previous one)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    headingRef.current?.focus({ preventScroll: true })
    headingRef.current?.scrollIntoView({ block: "center" })
  }, [step])

  useEffect(() => {
    if (failedAttempts > 0) {
      errorSummaryRef.current?.focus({ preventScroll: true })
      errorSummaryRef.current?.scrollIntoView({ block: "center" })
    }
  }, [failedAttempts])

  const update = (field: keyof Values, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleContinue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setFailedAttempts((n) => n + 1)
      return
    }
    honeypotValue.current = honeypotRef.current?.value || ""
    setSubmitError("")
    setStep("review")
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setSubmitError("")
    try {
      const response = await sdk.client.fetch<SubmitResult>(`/store/revocation`, {
        method: "POST",
        body: {
          name: values.name.trim(),
          orderReference: values.orderReference.trim(),
          email: values.email.trim(),
          scope: values.scope,
          partialText: values.scope === "partial" ? values.partialText.trim() : undefined,
          company_website: honeypotValue.current || undefined,
        },
      })
      setResult(response)
      setStep("success")
    } catch (error: any) {
      const status = error?.status
      setSubmitError(
        status === 429
          ? "Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es in einigen Minuten erneut oder senden Sie Ihren Widerruf per E-Mail an office@strickerei-jutta.at."
          : "Ihr Widerruf konnte nicht übermittelt werden. Bitte versuchen Sie es erneut oder senden Sie ihn per E-Mail an office@strickerei-jutta.at."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const errorEntries = Object.entries(errors).filter(([, msg]) => !!msg) as [FieldName, string][]

  if (step === "success") {
    return (
      <div role="status" className="space-y-4">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-serif text-2xl font-medium text-stone-800 outline-none"
        >
          Ihr Widerruf ist bei uns eingegangen
        </h2>
        {result?.reference && (
          <dl className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2 text-stone-800">
            <div className="flex flex-col small:flex-row small:gap-2">
              <dt className="font-medium">Eingegangen am:</dt>
              <dd>{result.received_at_formatted}</dd>
            </div>
            <div className="flex flex-col small:flex-row small:gap-2">
              <dt className="font-medium">Referenznummer:</dt>
              <dd>{result.reference}</dd>
            </div>
          </dl>
        )}
        {result?.confirmation_sent === false ? (
          <p className="text-stone-700">
            Die automatische Bestätigungs-E-Mail konnte leider nicht versendet werden. Wir
            senden Ihnen die Eingangsbestätigung umgehend manuell an {values.email.trim()}.
            Bitte notieren Sie sich die Referenznummer oder drucken Sie diese Seite aus.
          </p>
        ) : (
          <p className="text-stone-700">
            Eine Eingangsbestätigung mit dem Inhalt Ihrer Erklärung sowie Datum und Uhrzeit
            des Eingangs haben wir an <strong>{values.email.trim()}</strong> gesendet. Bitte
            prüfen Sie gegebenenfalls auch Ihren Spam-Ordner.
          </p>
        )}
        <p className="text-stone-700">
          Bitte senden Sie die betroffenen Waren binnen 14 Tagen auf Ihre Kosten an: Ing.
          Jutta Strobl, Wiener Neustädterstraße 47, 7021 Draßburg, Österreich. Den Kaufpreis
          erstatten wir, sobald die Ware bei uns eingetroffen ist.
        </p>
      </div>
    )
  }

  if (step === "review") {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-stone-600">Schritt 2 von 2</p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-serif text-2xl font-medium text-stone-800 outline-none"
          >
            Bitte prüfen Sie Ihre Angaben
          </h2>
        </div>

        <dl className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3 text-stone-800">
          <div>
            <dt className="text-sm text-stone-600">Name</dt>
            <dd className="font-medium break-words">{values.name.trim()}</dd>
          </div>
          <div>
            <dt className="text-sm text-stone-600">Bestell- oder Rechnungsnummer</dt>
            <dd className="font-medium break-words">{values.orderReference.trim()}</dd>
          </div>
          <div>
            <dt className="text-sm text-stone-600">E-Mail für die Eingangsbestätigung</dt>
            <dd className="font-medium break-words">{values.email.trim()}</dd>
          </div>
          <div>
            <dt className="text-sm text-stone-600">Umfang</dt>
            <dd className="font-medium">
              {values.scope === "full" ? "Gesamter Vertrag" : "Teil des Vertrags"}
            </dd>
          </div>
          {values.scope === "partial" && (
            <div>
              <dt className="text-sm text-stone-600">Betroffene Artikel</dt>
              <dd className="font-medium whitespace-pre-line break-words">
                {values.partialText.trim()}
              </dd>
            </div>
          )}
        </dl>

        <div>
          <h3 className="font-medium text-stone-800 mb-2">Ihre Erklärung</h3>
          <blockquote className="border-l-4 border-stone-300 pl-4 text-stone-700 whitespace-pre-line break-words">
            {buildDeclarationText(values)}
          </blockquote>
        </div>

        {submitError && (
          <div
            role="alert"
            className="bg-red-50 border border-red-300 text-red-900 px-4 py-3 rounded-lg"
          >
            {submitError}
          </div>
        )}

        <p className="text-sm text-stone-600">
          Mit Klick auf die Schaltfläche unten wird Ihr Widerruf verbindlich übermittelt.
        </p>

        <div className="flex flex-col-reverse small:flex-row gap-3">
          <button
            type="button"
            onClick={() => setStep("form")}
            disabled={isSubmitting}
            className="min-h-[48px] px-6 py-3 rounded-lg border-2 border-stone-800 text-stone-800 font-medium hover:bg-stone-100 disabled:opacity-60"
          >
            Zurück und ändern
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="min-h-[48px] px-6 py-3 rounded-lg bg-stone-800 text-white text-lg font-semibold hover:bg-stone-900 disabled:bg-stone-500"
          >
            Widerruf bestätigen
          </button>
        </div>
        <p role="status" className="text-sm text-stone-600 min-h-[1.25rem]">
          {isSubmitting ? "Ihr Widerruf wird übermittelt …" : ""}
        </p>
      </div>
    )
  }

  const describedBy = (field: FieldName, hint?: string) =>
    [hint, errors[field] ? `${field}-error` : undefined].filter(Boolean).join(" ") || undefined

  return (
    <form onSubmit={handleContinue} noValidate className="space-y-6">
      <div>
        <p className="text-sm text-stone-600">Schritt 1 von 2</p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-serif text-2xl font-medium text-stone-800 outline-none"
        >
          Angaben zum Widerruf
        </h2>
        <p className="text-sm text-stone-600 mt-2">
          Alle Felder mit * sind Pflichtfelder.
        </p>
      </div>

      {errorEntries.length > 0 && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="bg-red-50 border border-red-300 text-red-900 px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-red-700"
        >
          <p className="font-medium mb-1">Bitte korrigieren Sie folgende Angaben:</p>
          <ul className="list-disc pl-5 space-y-1">
            {errorEntries.map(([field, message]) => (
              <li key={field}>
                <a href={`#revocation-${field}`} className="underline underline-offset-2">
                  {FIELD_LABELS[field]}: {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="revocation-name" className="block text-sm font-medium text-stone-800 mb-2">
          {FIELD_LABELS.name} *
        </label>
        <input
          id="revocation-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={describedBy("name")}
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          className={inputClass(!!errors.name)}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-800">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="revocation-orderReference"
          className="block text-sm font-medium text-stone-800 mb-2"
        >
          {FIELD_LABELS.orderReference} *
        </label>
        <input
          id="revocation-orderReference"
          name="orderReference"
          type="text"
          required
          aria-required="true"
          aria-invalid={!!errors.orderReference}
          aria-describedby={describedBy("orderReference", "orderReference-hint")}
          value={values.orderReference}
          onChange={(e) => update("orderReference", e.target.value)}
          className={inputClass(!!errors.orderReference)}
        />
        <p id="orderReference-hint" className="mt-1 text-sm text-stone-600">
          Zu finden in Ihrer Bestellbestätigung, z. B. #1234 oder RE-001234.
        </p>
        {errors.orderReference && (
          <p id="orderReference-error" className="mt-1 text-sm text-red-800">
            {errors.orderReference}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="revocation-email" className="block text-sm font-medium text-stone-800 mb-2">
          {FIELD_LABELS.email} *
        </label>
        <input
          id="revocation-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={describedBy("email")}
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          className={inputClass(!!errors.email)}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-800">
            {errors.email}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-stone-800 mb-3">
          Was möchten Sie widerrufen? *
        </legend>
        <div className="space-y-3">
          {(
            [
              ["full", "Den gesamten Vertrag (alle Artikel der Bestellung)"],
              ["partial", "Nur einen Teil des Vertrags (einzelne Artikel)"],
            ] as [Scope, string][]
          ).map(([scope, label]) => (
            <label
              key={scope}
              className="flex items-start gap-3 p-3 border border-stone-300 rounded-lg cursor-pointer has-[:checked]:border-stone-800 has-[:checked]:bg-stone-50"
            >
              <input
                type="radio"
                name="scope"
                value={scope}
                checked={values.scope === scope}
                onChange={() => update("scope", scope)}
                className="mt-1 h-5 w-5 accent-stone-800"
              />
              <span className="text-stone-800">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {values.scope === "partial" && (
        <div>
          <label
            htmlFor="revocation-partialText"
            className="block text-sm font-medium text-stone-800 mb-2"
          >
            {FIELD_LABELS.partialText} *
          </label>
          <textarea
            id="revocation-partialText"
            name="partialText"
            rows={4}
            required
            aria-required="true"
            aria-invalid={!!errors.partialText}
            aria-describedby={describedBy("partialText", "partialText-hint")}
            value={values.partialText}
            onChange={(e) => update("partialText", e.target.value)}
            className={inputClass(!!errors.partialText)}
          />
          <p id="partialText-hint" className="mt-1 text-sm text-stone-600">
            Bitte nennen Sie Artikelbezeichnung, Farbe, Größe und Anzahl.
          </p>
          {errors.partialText && (
            <p id="partialText-error" className="mt-1 text-sm text-red-800">
              {errors.partialText}
            </p>
          )}
        </div>
      )}

      {/* Honeypot: invisible to people and assistive tech, only bots fill it */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto w-px h-px overflow-hidden">
        <label htmlFor="revocation-company-website">Bitte leer lassen</label>
        <input
          ref={honeypotRef}
          id="revocation-company-website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <button
        type="submit"
        className="w-full small:w-auto min-h-[48px] px-6 py-3 rounded-lg bg-stone-800 text-white font-semibold hover:bg-stone-900"
      >
        Weiter zur Überprüfung
      </button>
    </form>
  )
}
