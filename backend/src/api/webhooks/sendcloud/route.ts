import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
// Correct import for the service
import FulfillmentModuleService from "@medusajs/fulfillment";
// Use the correct import path as per documentation
import { markFulfillmentAsDeliveredWorkflow } from "@medusajs/medusa/core-flows";

// Define types for the expected Sendcloud payload
interface SendcloudParcel {
  id: number;
  tracking_number: string;
  status: {
    id: number;
    message: string;
  };
  order_number?: string;
}

interface SendcloudWebhookPayload {
  action: string;
  parcel: SendcloudParcel;
  timestamp?: string;
}

// Helper function for safe property access
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

// Add debugging information for Railway
console.log("[RAILWAY DEBUG] Loading Sendcloud webhook route file");

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log(
    "[SendcloudWebhook] Received webhook:",
    JSON.stringify(req.body, null, 2)
  );

  try {
    // Log debugging information
    console.log("[RAILWAY DEBUG] Attempting to resolve fulfillment module service");
    
    // Resolve the Fulfillment Module Service
    const fulfillmentModuleService = req.scope.resolve(Modules.FULFILLMENT);
    console.log("Successfully resolved Fulfillment Module Service (type inferred).");

    // Extract relevant data
    const payload = req.body as SendcloudWebhookPayload;
    const action = get(payload, 'action');
    const parcel = get(payload, 'parcel');
    const trackingNumber = get(parcel, 'tracking_number');
    const statusMessage = get(parcel, 'status.message');

    if (!action || !parcel || !trackingNumber || !statusMessage) {
      console.error("Webhook payload is missing required properties (action, parcel, tracking_number, status.message).");
      return res.status(200).json({ success: false, message: "Invalid payload structure." });
    }

    console.log(`Action: ${action}, Tracking: ${trackingNumber}, Status: ${statusMessage}`);

    // Find the corresponding Medusa Fulfillment
    let medusaFulfillmentId: string | undefined = undefined;
    let foundFulfillment: any | undefined = undefined;

    try {
      // Use the correct provider ID
      const providerId = 'sendcloud_sendcloud';

      console.log(`Listing fulfillments with provider_id '${providerId}' to find tracking number: ${trackingNumber}`);

      // Load 'labels' relation
      const fulfillmentsFromProvider = await fulfillmentModuleService.listFulfillments(
        { provider_id: [providerId] },
        { relations: ["labels", "metadata"] }
      );

      console.log(`Found ${fulfillmentsFromProvider.length} fulfillments from provider '${providerId}'. Now attempting manual search using 'labels'.`);

      // Search within the 'labels' array
      for (const fulfillment of fulfillmentsFromProvider) {
        const labels = get(fulfillment, 'labels');

        if (Array.isArray(labels)) {
          // Find a label whose tracking_number matches
          const matchingLabel = labels.find(
            (label: any) => get(label, 'tracking_number') === trackingNumber
          );

          if (matchingLabel) {
            console.log(`Found matching Medusa fulfillment ID: ${fulfillment.id} by searching 'labels' array.`);
            medusaFulfillmentId = fulfillment.id;
            foundFulfillment = fulfillment;
            break;
          }
        }
      }

      if (!medusaFulfillmentId) {
        console.warn(`No Medusa fulfillment found for tracking number: ${trackingNumber} after searching 'labels' array.`);
      }

    } catch(listError) {
      // Handle error with proper type checking
      const errorMessage = listError instanceof Error ? listError.message : String(listError);
      console.error("Error trying to list fulfillments (check if 'labels' relation is correct):", errorMessage);
    }

    // Execute actions based on the webhook (only if fulfillment was found)
    if (medusaFulfillmentId && foundFulfillment) {
      if (action === "parcel_status_changed") {
        console.log(`Processing status change for Medusa fulfillment ${medusaFulfillmentId} to ${statusMessage}`);

        if (statusMessage.toLowerCase() === "delivered") {
          try {
            const workflowInput = { id: medusaFulfillmentId };
            console.log(`Triggering 'markFulfillmentAsDeliveredWorkflow' for fulfillment ${medusaFulfillmentId}...`);
            
            // Add extra debugging for Railway
            console.log("[RAILWAY DEBUG] About to call markFulfillmentAsDeliveredWorkflow");
            console.log("[RAILWAY DEBUG] Workflow input:", JSON.stringify(workflowInput));
            
            await markFulfillmentAsDeliveredWorkflow(req.scope).run({ input: workflowInput });
            console.log(`Workflow 'markFulfillmentAsDeliveredWorkflow' completed for fulfillment ${medusaFulfillmentId}`);
          } catch (workflowError) {
            const errorMessage = workflowError instanceof Error ? workflowError.message : String(workflowError);
            console.error(`Error running markFulfillmentAsDeliveredWorkflow for ${medusaFulfillmentId}:`, errorMessage);
            
            // Additional debugging for Railway
            console.error("[RAILWAY DEBUG] Workflow error details:", workflowError);
          }
        } else {
          console.log(`TODO: Implement logic for status '${statusMessage}' on fulfillment ${medusaFulfillmentId}`);
          try {
            await fulfillmentModuleService.updateFulfillment(medusaFulfillmentId, {
              metadata: {
                ...(foundFulfillment.metadata || {}),
                last_sendcloud_status: statusMessage,
                last_sendcloud_status_timestamp: payload.timestamp || new Date().toISOString()
              }
            });
            console.log(`Updated metadata for fulfillment ${medusaFulfillmentId}`);
          } catch (updateError) {
            const errorMessage = updateError instanceof Error ? updateError.message : String(updateError);
            console.error(`Error updating metadata for fulfillment ${medusaFulfillmentId}:`, errorMessage);
          }
        }
      } else {
        console.log(`Unhandled action '${action}' for fulfillment ${medusaFulfillmentId}`);
      }
    } else {
      console.log(`No action taken as no matching Medusa fulfillment was found for tracking: ${trackingNumber}`);
    }

    return res.status(200).json({
      success: true,
      message: "Webhook received and processing attempted (check logs for details).",
      payload: req.body,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[SendcloudWebhook] Unhandled error in POST handler:", errorMessage);
    
    // Additional debugging for Railway
    console.error("[RAILWAY DEBUG] Full error object:", error);
    
    return res.status(200).json({
      success: false,
      message: `Unhandled error processing webhook: ${errorMessage}`,
      payload: req.body,
    });
  }
};

// Disable CORS and authentication for this endpoint
export const CORS = false;
export const AUTHENTICATE = false;