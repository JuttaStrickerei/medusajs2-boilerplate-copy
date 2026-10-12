import { Logger } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import type { MetaServerEvent } from "./purchase-event"

// Supported for at least two years after its release (Feb 2026)
const GRAPH_API_VERSION = "v25.0"
const REQUEST_TIMEOUT_MS = 10_000
const RETRY_DELAY_MS = 1_500

type Options = {
  pixelId: string
  accessToken: string
  // Events Manager → "Events testen": events show up there, for dev only
  testEventCode?: string
}

type InjectedDependencies = {
  logger: Logger
}

type GraphResponse = {
  events_received?: number
  error?: { message?: string; code?: number; error_user_msg?: string }
}

class MetaCapiModuleService {
  protected options_: Options
  protected logger_: Logger

  constructor({ logger }: InjectedDependencies, options: Options) {
    if (!options?.pixelId || !options?.accessToken) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Meta CAPI needs a pixel id and an access token"
      )
    }
    this.options_ = options
    this.logger_ = logger
  }

  get isTestMode(): boolean {
    return !!this.options_.testEventCode
  }

  /**
   * Sends server events to the dataset. One retry on network errors, rate
   * limits and Meta-side errors; 4xx answers (bad payload) are not retried.
   * The access token goes in the body, so it never ends up in a logged URL.
   */
  async sendEvents(events: MetaServerEvent[]): Promise<number> {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.options_.pixelId}/events`
    const body = JSON.stringify({
      data: events,
      access_token: this.options_.accessToken,
      ...(this.options_.testEventCode
        ? { test_event_code: this.options_.testEventCode }
        : {}),
    })

    try {
      return await this.post(url, body)
    } catch (error) {
      if (!(error as { retryable?: boolean }).retryable) throw error
      this.logger_.warn(
        `[MetaCapi] ${(error as Error).message}, retrying once`
      )
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      return this.post(url, body)
    }
  }

  private async post(url: string, body: string): Promise<number> {
    let response: Response
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      throw Object.assign(
        new Error(`request failed: ${(error as Error).message}`),
        { retryable: true }
      )
    }

    const json = (await response.json().catch(() => ({}))) as GraphResponse
    if (!response.ok) {
      const message =
        json.error?.error_user_msg || json.error?.message || "no details"
      throw Object.assign(
        new Error(`Meta answered ${response.status}: ${message}`),
        { retryable: response.status === 429 || response.status >= 500 }
      )
    }
    return json.events_received ?? 0
  }
}

export default MetaCapiModuleService
