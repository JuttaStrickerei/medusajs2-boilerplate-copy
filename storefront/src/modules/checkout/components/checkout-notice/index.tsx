"use client"

/**
 * Hinweis statt einer leeren oder blockierten Kasse: sagt, was los ist, und
 * zeigt einen Weg weiter (neu laden, Adresse ändern, uns schreiben).
 */
export default function CheckoutNotice({
  title,
  children,
  reload = false,
  className = "",
  "data-testid": dataTestId,
}: {
  title: string
  children?: React.ReactNode
  /** Knopf „Seite neu laden“ zeigen (hilft bei kurzen Verbindungsfehlern) */
  reload?: boolean
  className?: string
  "data-testid"?: string
}) {
  return (
    <div
      role="alert"
      className={`p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-stone-700 space-y-2 ${className}`}
      data-testid={dataTestId}
    >
      <p className="font-medium text-stone-800">{title}</p>
      {children}
      <p>
        Wir helfen Ihnen gerne weiter:{" "}
        <a
          href="mailto:office@strickerei-jutta.at"
          className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
        >
          office@strickerei-jutta.at
        </a>
      </p>
      {reload && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-1 font-medium text-stone-800 underline underline-offset-4 hover:text-stone-600"
        >
          Seite neu laden
        </button>
      )}
    </div>
  )
}
