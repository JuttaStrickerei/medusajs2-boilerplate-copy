import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { 
  markFulfillmentAsDeliveredWorkflow,
  updateFulfillmentWorkflow 
} from "@medusajs/medusa/core-flows";
import { SENDCLOUD_SHIPMENT_MODULE } from "../../../modules/sendcloud-shipment";

/**
 * Sendcloud Webhook Handler
 * 
 * Handles status updates from Sendcloud and maps them to Medusa fulfillment statuses.
 * 
 * Sendcloud Status → Medusa Status Mapping:
 * - ready to send, announced, registered → shipped (sets shipped_at)
 * - at sorting, in transit, out for delivery → shipped (metadata update)
 * - delivered, picked up → delivered (sets delivered_at via workflow)
 * - delivery failed, not delivered → not_delivered (metadata update)
 * - cancelled, deleted → canceled (metadata update)
 * - return to sender, returned → returned (metadata update)
 */

// Sendcloud Webhook Payload Types
interface SendcloudParcel {
  id: number;
  tracking_number: string;
  tracking_url?: string;
  status: {
    id: number;
    message: string;
  };
  order_number?: string;
  carrier?: {
    code: string;
  };
  date_updated?: string;
}

interface SendcloudWebhookPayload {
  action: string;
  parcel: SendcloudParcel;
  timestamp?: string;
}

// Sendcloud Status Mapping
type MedusaFulfillmentStatus = 
  | "pending" 
  | "shipped" 
  | "delivered" 
  | "not_delivered" 
  | "canceled" 
  | "returned";

// Map Sendcloud status messages to Medusa statuses
const SENDCLOUD_STATUS_MAP: Record<string, MedusaFulfillmentStatus> = {
  // Pending / Created states
  "ready to send": "pending",
  "ready for order": "pending",
  "awaiting label": "pending",
  "new": "pending",
  "data received": "pending",
  
  // Shipped states (triggers shipped_at)
  "announced": "shipped",
  "registered": "shipped",
  "announced at carrier": "shipped",
  "sent to carrier": "shipped",
  "handed to carrier": "shipped",
  "picked up by carrier": "shipped",
  
  // In transit states (still shipped)
  "at sorting": "shipped",
  "sorting": "shipped",
  "in transit": "shipped",
  "with delivery courier": "shipped",
  "out for delivery": "shipped",
  "ready for pickup": "shipped",
  "at pickup point": "shipped",
  
  // Delivered states (triggers delivered_at via workflow)
  "delivered": "delivered",
  "delivered to pickup point": "delivered",
  "picked up at pickup point": "delivered",
  "picked up": "delivered",
  
  // Delivery failed states
  "delivery attempt failed": "not_delivered",
  "not delivered": "not_delivered",
  "delivery failed": "not_delivered",
  "unable to deliver": "not_delivered",
  "not collected": "not_delivered",
  
  // Canceled states
  "cancelled": "canceled",
  "canceled": "canceled",
  "deleted": "canceled",
  "parcel deleted": "canceled",
  
  // Return states
  "return to sender": "returned",
  "returned": "returned",
  "returned to sender": "returned",
};

// Helper to safely get nested properties
const get = (obj: any, path: string, defaultValue: any = undefined) => {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined || result === null) {
      return defaultValue;
    }
  }
  return result;
};

// Map Sendcloud status to Medusa status
const mapSendcloudStatus = (statusMessage: string): MedusaFulfillmentStatus => {
  const normalized = statusMessage.toLowerCase().trim();
  return SENDCLOUD_STATUS_MAP[normalized] || "shipped"; // Default to shipped for unknown statuses
};

// Check if this is the first time we're seeing a "shipped" status
const isFirstShippedStatus = (currentMetadata: any): boolean => {
  return !currentMetadata?.sendcloud_shipped_at;
};


export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const startTime = Date.now();
  
  console.log("[SendcloudWebhook] ════════════════════════════════════════════");
  console.log("[SendcloudWebhook] Received webhook at:", new Date().toISOString());
  console.log("[SendcloudWebhook] Payload:", JSON.stringify(req.body, null, 2));

  try {
    const fulfillmentModuleService = req.scope.resolve(Modules.FULFILLMENT);
    
    // 1. Parse and validate payload
    const payload = req.body as SendcloudWebhookPayload;
    const action = get(payload, 'action');
    const parcel = get(payload, 'parcel') as SendcloudParcel;
    const trackingNumber = get(parcel, 'tracking_number');
    const statusMessage = get(parcel, 'status.message');
    const parcelId = get(parcel, 'id');

    if (!action || !parcel || !trackingNumber || !statusMessage) {
      console.error("[SendcloudWebhook] ❌ Invalid payload - missing required fields");
      return res.status(200).json({ 
        success: false, 
        message: "Invalid payload structure - missing action, parcel, tracking_number, or status.message" 
      });
    }

    console.log(`[SendcloudWebhook] 📦 Action: ${action}`);
    console.log(`[SendcloudWebhook] 📦 Parcel ID: ${parcelId}`);
    console.log(`[SendcloudWebhook] 📦 Tracking: ${trackingNumber}`);
    console.log(`[SendcloudWebhook] 📦 Status: ${statusMessage}`);

    // Only process parcel_status_changed actions
    if (action !== "parcel_status_changed") {
      console.log(`[SendcloudWebhook] ⏭️ Skipping non-status action: ${action}`);
      return res.status(200).json({ 
        success: true, 
        message: `Action '${action}' acknowledged but not processed` 
      });
    }

    // 2. Map Sendcloud status to Medusa status
    const medusaStatus = mapSendcloudStatus(statusMessage);
    console.log(`[SendcloudWebhook] 🔄 Mapped status: "${statusMessage}" → "${medusaStatus}"`);

    // 3. Find the matching Medusa fulfillment
    let medusaFulfillmentId: string | undefined;
    let foundFulfillment: any | undefined;

    try {
      const providerId = 'sendcloud_sendcloud';
      
      // First try to find by parcel_id in data (most reliable)
      const allFulfillments = await fulfillmentModuleService.listFulfillments(
        { provider_id: [providerId] },
        { relations: ["labels"] }
      );

      console.log(`[SendcloudWebhook] 🔍 Searching ${allFulfillments.length} Sendcloud fulfillments...`);

      for (const fulfillment of allFulfillments) {
        // Check by parcel_id in data field
        const dataParcelId = get(fulfillment, 'data.parcel_id');
        if (dataParcelId && String(dataParcelId) === String(parcelId)) {
          console.log(`[SendcloudWebhook] ✅ Found by parcel_id: ${fulfillment.id}`);
          medusaFulfillmentId = fulfillment.id;
          foundFulfillment = fulfillment;
          break;
        }

        // Fallback: Check by tracking_number in labels
        const labels = get(fulfillment, 'labels') || [];
        if (Array.isArray(labels)) {
          const matchingLabel = labels.find(
            (label: any) => get(label, 'tracking_number') === trackingNumber
          );
          if (matchingLabel) {
            console.log(`[SendcloudWebhook] ✅ Found by tracking_number: ${fulfillment.id}`);
            medusaFulfillmentId = fulfillment.id;
            foundFulfillment = fulfillment;
            break;
          }
        }

        // Also check tracking_number in data field
        const dataTrackingNumber = get(fulfillment, 'data.tracking_number');
        if (dataTrackingNumber === trackingNumber) {
          console.log(`[SendcloudWebhook] ✅ Found by data.tracking_number: ${fulfillment.id}`);
          medusaFulfillmentId = fulfillment.id;
          foundFulfillment = fulfillment;
          break;
        }
      }

      if (!medusaFulfillmentId) {
        console.warn(`[SendcloudWebhook] ⚠️ No fulfillment found for parcel_id=${parcelId} or tracking=${trackingNumber}`);
        return res.status(200).json({ 
          success: true, 
          message: `No matching fulfillment found for tracking: ${trackingNumber}` 
        });
      }

    } catch (listError: any) {
      console.error("[SendcloudWebhook] ❌ Error listing fulfillments:", listError.message);
      return res.status(200).json({ 
        success: false, 
        message: `Error finding fulfillment: ${listError.message}` 
      });
    }

    // 4. Update fulfillment based on status
    const currentMetadata = foundFulfillment.metadata || {};
    const timestamp = payload.timestamp || new Date().toISOString();

    try {
      switch (medusaStatus) {
        case "shipped": {
          // Check if this is the first "shipped" status (set shipped_at)
          if (!foundFulfillment.shipped_at && isFirstShippedStatus(currentMetadata)) {
            console.log(`[SendcloudWebhook] 🚚 Setting shipped_at for ${medusaFulfillmentId}`);
            
            await updateFulfillmentWorkflow(req.scope).run({
              input: {
                id: medusaFulfillmentId,
                shipped_at: new Date(),
                metadata: {
                  ...currentMetadata,
                  sendcloud_status: statusMessage,
                  sendcloud_status_id: parcel.status.id,
                  sendcloud_shipped_at: timestamp,
                  sendcloud_last_update: timestamp,
                  sendcloud_tracking_url: parcel.tracking_url,
                  sendcloud_carrier: parcel.carrier?.code,
                }
              }
            });
            console.log(`[SendcloudWebhook] ✅ Fulfillment marked as shipped`);
          } else {
            // Just update metadata for transit updates
            console.log(`[SendcloudWebhook] 📍 Updating transit status for ${medusaFulfillmentId}`);
            await updateFulfillmentWorkflow(req.scope).run({
              input: {
                id: medusaFulfillmentId,
                metadata: {
                  ...currentMetadata,
                  sendcloud_status: statusMessage,
                  sendcloud_status_id: parcel.status.id,
                  sendcloud_last_update: timestamp,
                }
              }
            });
          }
          break;
        }

        case "delivered": {
          console.log(`[SendcloudWebhook] 📬 Marking as delivered: ${medusaFulfillmentId}`);
          
          try {
            await markFulfillmentAsDeliveredWorkflow(req.scope).run({
              input: { id: medusaFulfillmentId }
            });
            console.log(`[SendcloudWebhook] ✅ Fulfillment marked as delivered`);
          } catch (deliveryError: any) {
            // If workflow fails (e.g., already delivered), just update metadata
            console.warn(`[SendcloudWebhook] ⚠️ Delivery workflow failed (may already be delivered): ${deliveryError.message}`);
            await updateFulfillmentWorkflow(req.scope).run({
              input: {
                id: medusaFulfillmentId,
                metadata: {
                  ...currentMetadata,
                  sendcloud_status: statusMessage,
                  sendcloud_status_id: parcel.status.id,
                  sendcloud_delivered_at: timestamp,
                  sendcloud_last_update: timestamp,
                }
              }
            });
          }
          break;
        }

        case "not_delivered": {
          console.log(`[SendcloudWebhook] ⚠️ Delivery failed: ${medusaFulfillmentId}`);
          await updateFulfillmentWorkflow(req.scope).run({
            input: {
              id: medusaFulfillmentId,
              metadata: {
                ...currentMetadata,
                sendcloud_status: statusMessage,
                sendcloud_status_id: parcel.status.id,
                sendcloud_delivery_failed: true,
                sendcloud_delivery_failed_at: timestamp,
                sendcloud_last_update: timestamp,
              }
            }
          });
          break;
        }

        case "canceled": {
          console.log(`[SendcloudWebhook] ❌ Parcel canceled: ${medusaFulfillmentId}`);
          await updateFulfillmentWorkflow(req.scope).run({
            input: {
              id: medusaFulfillmentId,
              metadata: {
                ...currentMetadata,
                sendcloud_status: statusMessage,
                sendcloud_status_id: parcel.status.id,
                sendcloud_canceled_at: timestamp,
                sendcloud_last_update: timestamp,
              }
            }
          });
          break;
        }

        case "returned": {
          console.log(`[SendcloudWebhook] 📦 Parcel returned: ${medusaFulfillmentId}`);
          await updateFulfillmentWorkflow(req.scope).run({
            input: {
              id: medusaFulfillmentId,
              metadata: {
                ...currentMetadata,
                sendcloud_status: statusMessage,
                sendcloud_status_id: parcel.status.id,
                sendcloud_returned_at: timestamp,
                sendcloud_last_update: timestamp,
              }
            }
          });
          break;
        }

        default: {
          // For pending and unknown statuses, just update metadata
          console.log(`[SendcloudWebhook] 📝 Updating metadata for status: ${medusaStatus}`);
          await updateFulfillmentWorkflow(req.scope).run({
            input: {
              id: medusaFulfillmentId,
              metadata: {
                ...currentMetadata,
                sendcloud_status: statusMessage,
                sendcloud_status_id: parcel.status.id,
                sendcloud_last_update: timestamp,
              }
            }
          });
        }
      }
    } catch (updateError: any) {
      console.error(`[SendcloudWebhook] ❌ Error updating fulfillment: ${updateError.message}`);
      return res.status(200).json({ 
        success: false, 
        message: `Error updating fulfillment: ${updateError.message}` 
      });
    }

    // Sync status to sendcloud_shipment table (best-effort, never blocks webhook response)
    try {
      const shipmentService = req.scope.resolve(SENDCLOUD_SHIPMENT_MODULE) as any
      const existing = await shipmentService.listSendcloudShipments({
        sendcloud_id: String(parcelId),
      })

      if (existing.length > 0) {
        const updateData: Record<string, unknown> = {
          id: existing[0].id,
          status: medusaStatus === "shipped" ? "announced" : medusaStatus,
          tracking_number: trackingNumber,
          tracking_url: parcel.tracking_url || existing[0].tracking_url,
          carrier: parcel.carrier?.code || existing[0].carrier,
        }
        if (medusaStatus === "delivered") updateData.delivered_at = new Date()
        if (medusaStatus === "shipped" && !existing[0].shipped_at) updateData.shipped_at = new Date()

        await shipmentService.updateSendcloudShipments(updateData)
        console.log(`[SendcloudWebhook] Synced status to sendcloud_shipment table`)
      } else if (foundFulfillment) {
        const addr = (foundFulfillment as any).delivery_address || {}
        const ffData = (foundFulfillment.data || {}) as Record<string, any>
        const isReturn = ffData.is_return === true

        let orderId = "unknown"
        try {
          const query = req.scope.resolve("query") as any
          const { data: orderFulfillments } = await query.graph({
            entity: "order_fulfillment",
            fields: ["order_id"],
            filters: { fulfillment_id: medusaFulfillmentId },
          })
          if (orderFulfillments?.[0]?.order_id) {
            orderId = orderFulfillments[0].order_id
          }
        } catch { /* best-effort */ }

        await shipmentService.createSendcloudShipments({
          order_id: orderId,
          sendcloud_id: String(parcelId),
          tracking_number: trackingNumber,
          tracking_url: parcel.tracking_url || null,
          carrier: parcel.carrier?.code || null,
          status: medusaStatus === "shipped" ? "announced" : medusaStatus,
          is_return: isReturn,
          recipient_name:
            addr.first_name && addr.last_name
              ? `${addr.first_name} ${addr.last_name}`.trim()
              : addr.company || "Unknown",
          recipient_company: addr.company || null,
          recipient_address: addr.address_1 || "Unknown",
          recipient_house_number: addr.address_2 || "0",
          recipient_city: addr.city || "Unknown",
          recipient_postal_code: addr.postal_code || "00000",
          recipient_country: addr.country_code?.toUpperCase() || "AT",
          sendcloud_response: ffData,
          label_url: ffData.label_url || null,
          shipped_at: medusaStatus === "shipped" ? new Date() : null,
        })
        console.log(`[SendcloudWebhook] Created missing shipment record for parcel ${parcelId}`)
      }
    } catch (syncError: any) {
      console.warn(`[SendcloudWebhook] Shipment table sync failed (non-blocking): ${syncError.message}`)
    }

    const duration = Date.now() - startTime;
    console.log(`[SendcloudWebhook] ✅ Webhook processed in ${duration}ms`);

    return res.status(200).json({
      success: true,
      message: `Status updated: ${statusMessage} → ${medusaStatus}`,
      fulfillment_id: medusaFulfillmentId,
      duration_ms: duration,
    });

  } catch (error: any) {
    console.error("[SendcloudWebhook] ❌ Unhandled error:", error);
    return res.status(200).json({
      success: false,
      message: `Unhandled error: ${error.message}`,
    });
  }
};

// Disable CORS and authentication for this endpoint
export const CORS = false;
export const AUTHENTICATE = false;