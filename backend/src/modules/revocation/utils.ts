export type RevocationScope = "full" | "partial"

export const formatRevocationReference = (displayId: number) =>
  `WR-${displayId.toString().padStart(6, "0")}`

// Railway runs in UTC, so the Vienna time zone must be explicit.
export const formatReceivedAt = (date: Date) =>
  `${new Intl.DateTimeFormat("de-AT", {
    timeZone: "Europe/Vienna",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(date)} Uhr (Ortszeit Wien)`

export const buildDeclarationText = (input: {
  name: string
  orderReference: string
  scope: RevocationScope
  partialText?: string | null
}) => {
  const subject =
    input.scope === "full"
      ? `über sämtliche Waren der Bestellung ${input.orderReference}`
      : `über folgende Waren der Bestellung ${input.orderReference}: ${input.partialText}`

  return `Hiermit widerrufe ich, ${input.name}, den von mir abgeschlossenen Vertrag ${subject}.`
}
