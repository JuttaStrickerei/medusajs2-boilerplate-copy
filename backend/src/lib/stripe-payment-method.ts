/**
 * Die tatsächlich genutzte Zahlungsart einer Stripe-Zahlung, für Kundin und
 * Büro lesbar („Apple Pay“, „Kreditkarte (Visa •••• 4242)“, „PayPal“ …).
 *
 * Medusa speichert am Payment nur den PaymentIntent. Apple Pay und Google Pay
 * laufen dort als „card“; welches Wallet es war, steht nur an der Charge
 * (payment_method_details.card.wallet.type). Darum hier ein eigener Abruf mit
 * expand[]=latest_charge, per fetch statt eigenem Stripe-SDK.
 */

// Dieselbe API-Version wie der Medusa-Stripe-Provider (stripe-SDK 15.x),
// damit die Felder gleich aussehen
const STRIPE_API_VERSION = "2024-04-10"
const STRIPE_TIMEOUT_MS = 8000

export type PaymentMethodInfo = {
  /** Anzeigetext, deutsch */
  label: string
  /** Stripe-Art: apple_pay, google_pay, card, paypal, klarna, link, … */
  type: string
}

const CARD_BRANDS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
  cartes_bancaires: "Cartes Bancaires",
}

const METHOD_LABELS: Record<string, string> = {
  paypal: "PayPal",
  klarna: "Klarna",
  link: "Link",
  eps: "EPS",
  sofort: "Sofortüberweisung",
  sepa_debit: "SEPA-Lastschrift",
}

type StripeCharge = {
  payment_method_details?: {
    type?: string
    card?: {
      brand?: string
      last4?: string
      funding?: string
      wallet?: { type?: string } | null
    }
  } | null
}

/** Reine Umsetzung der Charge-Daten in einen Anzeigetext */
export function describeStripeCharge(
  charge: StripeCharge | null | undefined
): PaymentMethodInfo | null {
  const details = charge?.payment_method_details
  if (!details?.type) {
    return null
  }

  if (details.type === "card") {
    const card = details.card ?? {}
    const wallet = card.wallet?.type
    if (wallet === "apple_pay") return { label: "Apple Pay", type: "apple_pay" }
    if (wallet === "google_pay") return { label: "Google Pay", type: "google_pay" }
    if (wallet === "link") return { label: "Link", type: "link" }

    const kind =
      card.funding === "debit"
        ? "Debitkarte"
        : card.funding === "credit"
          ? "Kreditkarte"
          : "Karte"
    const brand = card.brand ? CARD_BRANDS[card.brand] ?? card.brand : null
    const suffix = [brand, card.last4 ? `•••• ${card.last4}` : null]
      .filter(Boolean)
      .join(" ")
    return { label: suffix ? `${kind} (${suffix})` : kind, type: "card" }
  }

  return {
    label: METHOD_LABELS[details.type] ?? details.type,
    type: details.type,
  }
}

/**
 * Holt den PaymentIntent samt letzter Charge von Stripe. Gibt null zurück,
 * wenn noch keine Charge existiert oder Stripe nicht antwortet; wirft nie.
 */
export async function fetchStripePaymentMethod(
  paymentIntentId: string,
  apiKey: string
): Promise<PaymentMethodInfo | null> {
  if (!paymentIntentId.startsWith("pi_")) {
    return null
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), STRIPE_TIMEOUT_MS)
  try {
    const res = await fetch(
      `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(
        paymentIntentId
      )}?expand[]=latest_charge`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Stripe-Version": STRIPE_API_VERSION,
        },
        signal: controller.signal,
      }
    )
    if (!res.ok) {
      return null
    }
    const intent = (await res.json()) as {
      latest_charge?: StripeCharge | string | null
    }
    const charge =
      intent.latest_charge && typeof intent.latest_charge === "object"
        ? intent.latest_charge
        : null
    return describeStripeCharge(charge)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
