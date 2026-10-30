"use client"

import { saveOrderSource } from "@lib/data/order-source"
import { FormEvent, useEffect, useState } from "react"

// Values must match ORDER_SOURCES in backend/src/workflows/save-order-source.ts
const OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google-Suche" },
  { value: "empfehlung", label: "Empfehlung von Familie oder Freunden" },
  { value: "geschaeft", label: "Im Geschäft in Draßburg" },
  { value: "newsletter", label: "Newsletter" },
  { value: "flyer_zeitung", label: "Flyer oder Zeitung" },
  { value: "sonstiges", label: "Anders" },
]
const OTHER = "sonstiges"
const MAX_TEXT_LENGTH = 200
// Remembers per order that the question was answered (per browser only)
const STORAGE_PREFIX = "jutta-order-source:"

type Status = "open" | "other" | "saving" | "done"

function wasAnswered(orderId: string): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + orderId) === "1"
  } catch {
    return false
  }
}

function rememberAnswer(orderId: string) {
  try {
    localStorage.setItem(STORAGE_PREFIX + orderId, "1")
  } catch {
    // Private mode or blocked storage: the question just shows again
  }
}

/** "Wie haben Sie von uns erfahren?" on the order confirmation page */
export default function OrderSourceSurvey({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<Status>("open")
  const [hidden, setHidden] = useState(true)
  const [text, setText] = useState("")

  // Read after mount: localStorage does not exist on the server
  useEffect(() => {
    setHidden(wasAnswered(orderId))
  }, [orderId])

  const submit = async (source: string, otherText?: string) => {
    setStatus("saving")
    await saveOrderSource(orderId, source, otherText)
    rememberAnswer(orderId)
    setStatus("done")
  }

  const choose = (source: string) => {
    if (source === OTHER) {
      setStatus("other")
      return
    }
    submit(source)
  }

  const submitOther = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit(OTHER, text.trim() || undefined)
  }

  if (hidden) return null

  if (status === "done") {
    return (
      <div
        className="rounded-xl border border-stone-200 bg-stone-50 px-6 py-5 text-center text-stone-700"
        role="status"
      >
        Vielen Dank! Das hilft uns sehr.
      </div>
    )
  }

  return (
    <section
      className="rounded-xl border border-stone-200 bg-stone-50 px-6 py-6"
      aria-labelledby="order-source-title"
      data-testid="order-source-survey"
    >
      <h2
        id="order-source-title"
        className="font-serif text-xl font-medium text-stone-800 text-center"
      >
        Wie haben Sie von uns erfahren?
      </h2>
      <p className="text-stone-500 text-sm text-center mt-1 mb-5">
        Eine kurze, freiwillige Frage. Ein Klick genügt.
      </p>

      {status === "other" ? (
        <form
          onSubmit={submitOther}
          className="flex flex-col small:flex-row gap-3 max-w-lg mx-auto"
        >
          <label htmlFor="order-source-text" className="sr-only">
            Wie haben Sie von uns erfahren?
          </label>
          <input
            id="order-source-text"
            type="text"
            value={text}
            maxLength={MAX_TEXT_LENGTH}
            onChange={(event) => setText(event.target.value)}
            placeholder="Zum Beispiel: Radio, Messe, Bekannte"
            autoFocus
            className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-stone-800 px-6 py-3 text-white hover:bg-stone-700 transition-colors"
          >
            Senden
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 small:grid-cols-2 gap-3 max-w-2xl mx-auto">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={status === "saving"}
              onClick={() => choose(option.value)}
              className="rounded-lg border border-stone-300 bg-white px-4 py-3 text-left text-stone-700 hover:border-stone-500 hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
