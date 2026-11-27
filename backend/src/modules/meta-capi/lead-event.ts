import { randomUUID } from "crypto"
import type { MetaServerEvent } from "./purchase-event"
import { normalizeEmail, sha256 } from "./purchase-event"

/**
 * Builds the Conversions API "Lead" for a new newsletter signup (route
 * api/store/newsletter). The storefront sends the browser part only with
 * "marketing" consent (lib/data/newsletter). Only the server reports the Lead,
 * the pixel does not: Meta keeps the browser event when both arrive within
 * 5 minutes, and the browser event would lack the e-mail.
 * - em: the signup address, normalised and SHA-256 hashed.
 * - fbc carries the ad click of this browser, so Meta can tie the signup and a
 *   later purchase with the same e-mail (maybe in another browser) to the ad.
 * Nothing of this is stored.
 */
export type LeadSignal = {
  event_source_url: string
  fbc?: string
  fbp?: string
  client_ip_address?: string
  client_user_agent?: string
}

export function buildLeadEvent(
  email: string,
  signal: LeadSignal,
  at: Date = new Date()
): MetaServerEvent {
  const em = normalizeEmail(email)
  const browser = Object.fromEntries(
    Object.entries({
      fbc: signal.fbc,
      fbp: signal.fbp,
      client_ip_address: signal.client_ip_address,
      client_user_agent: signal.client_user_agent,
    }).filter(([, value]) => !!value)
  ) as Record<string, string>

  return {
    event_name: "Lead",
    event_time: Math.floor(at.getTime() / 1000),
    // unique per signup: Meta drops a resent copy of the same event
    event_id: randomUUID(),
    action_source: "website",
    event_source_url: signal.event_source_url,
    user_data: {
      ...(em ? { em: [sha256(em)] } : {}),
      ...browser,
    },
    custom_data: {
      content_name: "Newsletter-Anmeldung",
      content_category: "newsletter",
    },
  }
}
