// src/modules/sendcloud/client.ts

import { MedusaError } from "@medusajs/framework/utils"
import { SendcloudOptions } from "./types"
import { 
  SendcloudShippingMethodsResponse, 
  SendcloudCreateParcelRequest,
  SendcloudCreateParcelResponse,
  SendcloudCancelResponse,
  SendcloudParcelResponse,
  SendcloudErrorResponse
} from "./types"

export class SendcloudClient {
  private baseUrl = "https://panel.sendcloud.sc/api/v2"
  private auth: string

  constructor(options: SendcloudOptions) {
    if (!options.public_key || !options.secret_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Sendcloud public_key and secret_key are required"
      )
    }

    this.auth = Buffer.from(
      `${options.public_key}:${options.secret_key}`
    ).toString('base64')

    if (process.env.NODE_ENV === 'development') {
      console.log("[SendcloudClient] Initialized")
    }
  }

  private async sendRequest<T>(
    endpoint: string, 
    options?: RequestInit
  ): Promise<T> {
    try {
      const headers = {
        "Authorization": `Basic ${this.auth}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      }
  
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options?.headers,
        }
      })
  
      const contentType = response.headers.get("content-type")
      let data: any
  
      if (contentType?.includes("application/json")) {
        data = await response.json()
      } else {
        data = await response.text()
      }
  
      if (endpoint.includes('/cancel') && !response.ok && response.status === 404) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "No Parcel matches the given query."
        )
      }
  
      if (!response.ok) {
        const errorResponse = data as SendcloudErrorResponse
        
        // Extract the actual error message from Sendcloud response
        const actualMessage = 
          errorResponse.error?.message || 
          errorResponse.errors?.[0]?.message ||
          (typeof data === 'string' ? data : null) ||
          (data?.message) ||
          `Sendcloud API error: ${response.statusText}`
        
        console.error("[SendcloudClient] API Error:", actualMessage, "Full response:", JSON.stringify(errorResponse))
        
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          actualMessage
        )
      }
  
      return data as T
    } catch (error) {
      if (error instanceof MedusaError) {
        throw error
      }
      
      console.error("[SendcloudClient] Request Error:", error)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Error contacting Sendcloud API: ${(error as Error).message}`
      )
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getShippingMethods()
      return true
    } catch (error) {
      console.error("[SendcloudClient] Connection test failed:", error)
      return false
    }
  }

// In src/modules/sendcloud/client.ts

  /**
   * Fetch shipping methods from Sendcloud with optional filters
   * @param params - Optional filters (to_country, from_country, is_return)
   */
  async getShippingMethods(params?: { 
    to_country?: string, 
    from_country?: string,
    is_return?: string,
  }): Promise<SendcloudShippingMethodsResponse> {
    const queryParams = new URLSearchParams()
    
    if (params?.to_country) {
      queryParams.append('to_country', params.to_country)
    }
    if (params?.from_country) {
      queryParams.append('from_country', params.from_country)
    }
    if (params?.is_return) {
      queryParams.append('is_return', params.is_return)
    }

    const endpoint = `/shipping_methods${
      queryParams.toString() ? '?' + queryParams.toString() : ''
    }`
    
    return await this.sendRequest<SendcloudShippingMethodsResponse>(endpoint)
  }

  /**
   * Fetch ALL available shipping methods without any country filters
   * This is used to populate fulfillment options in Medusa Admin
   */
  async getShippingMethodsAll(): Promise<SendcloudShippingMethodsResponse> {
    return await this.sendRequest<SendcloudShippingMethodsResponse>('/shipping_methods')
  }

  /**
   * Fetch return shipping methods without country filter
   */
  async getReturnShippingMethodsAll(): Promise<SendcloudShippingMethodsResponse> {
    return await this.sendRequest<SendcloudShippingMethodsResponse>('/shipping_methods?is_return=true')
  }

  async createParcel(data: SendcloudCreateParcelRequest): Promise<SendcloudCreateParcelResponse> {
    console.log("[SendcloudClient] Creating parcel with data:", JSON.stringify(data, null, 2))
    return await this.sendRequest<SendcloudCreateParcelResponse>('/parcels', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getParcel(id: number): Promise<SendcloudParcelResponse> {
    return await this.sendRequest<{ parcel: SendcloudParcelResponse }>(`/parcels/${id}`)
      .then(response => response.parcel)
  }

  /**
   * Cancel a parcel in Sendcloud
   */
  async cancelParcel(id: number): Promise<SendcloudCancelResponse> {
    return await this.sendRequest<SendcloudCancelResponse>(`/parcels/${id}/cancel`, {
      method: 'POST'
    })
  }

  /**
   * Delete a parcel from Sendcloud (permanent!)
   */
  async deleteParcel(id: number): Promise<SendcloudCancelResponse> {
    return await this.sendRequest<SendcloudCancelResponse>(`/parcels/${id}`, {
      method: 'DELETE'
    })
  }

  /**
   * Cancel a parcel in Sendcloud
   * Uses POST /parcels/:id/cancel which works for both announced and non-announced parcels.
   * Gracefully handles already-cancelled or deleted parcels.
   */
  async cancelOrDeleteParcel(id: number): Promise<SendcloudCancelResponse> {
    console.log("[SendcloudClient] Attempting to cancel parcel:", id)
    
    try {
      const result = await this.cancelParcel(id)
      console.log("[SendcloudClient] Parcel cancelled successfully:", id)
      return result
    } catch (cancelError: any) {
      const errorMsg = (cancelError?.message || String(cancelError)).toLowerCase()
      
      console.log("[SendcloudClient] Cancel error for parcel", id, "- message:", errorMsg)
      
      // Treat these as "success" - parcel is already cancelled/deleted
      const alreadyCancelledPatterns = [
        "already being cancelled",
        "shipment is already being cancelled",
        "this shipment is already being cancelled",
        "already cancelled",
        "already canceled",
        "parcel has been deleted",
        "parcel is deleted",
        "no parcel matches",
        "parcel not found",
        "not found",
        "gone",
        "404",
        "does not exist",
        "cannot be cancelled",
        "status does not allow",
        "cancellation not possible",
        "parcel was cancelled",
        "is being cancelled",
        "shipment is being cancelled",
        "bad request",  // Often means already cancelled in Sendcloud context
      ]
      
      for (const pattern of alreadyCancelledPatterns) {
        if (errorMsg.includes(pattern)) {
          console.log("[SendcloudClient] Parcel", id, "treating as already cancelled (pattern:", pattern, ")")
          return { 
            status: "cancelled", 
            message: `Parcel was already cancelled or deleted in Sendcloud (${errorMsg})` 
          } as SendcloudCancelResponse
        }
      }
      
      // Re-throw if it's a genuine error
      console.error("[SendcloudClient] Unexpected cancel error for parcel", id, ":", errorMsg)
      throw cancelError
    }
  }

  /**
   * Update an existing parcel with new data
   * NOTE: Parcel must NOT be announced yet (request_label must have been false)
   */
  async updateParcel(id: number, data: Partial<SendcloudCreateParcelRequest['parcel']>): Promise<SendcloudCreateParcelResponse> {
    return await this.sendRequest<SendcloudCreateParcelResponse>(`/parcels`, {
      method: 'PUT',
      body: JSON.stringify({
        parcel: {
          id,
          ...data
        }
      })
    })
  }

  /**
   * Request a label for an existing parcel (announces the parcel)
   * Once a label is requested, the parcel cannot be changed anymore
   */
  async requestLabel(id: number): Promise<SendcloudCreateParcelResponse> {
    return await this.sendRequest<SendcloudCreateParcelResponse>(`/parcels`, {
      method: 'PUT',
      body: JSON.stringify({
        parcel: {
          id,
          request_label: true
        }
      })
    })
  }

  async getLabel(parcelId: number): Promise<{ label: { normal_printer: string[] } }> {
    return await this.sendRequest<{ label: { normal_printer: string[] } }>(`/labels/${parcelId}`)
  }
}