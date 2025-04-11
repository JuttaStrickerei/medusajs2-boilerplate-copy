import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

// Dynamic import for workflow
let markFulfillmentAsDeliveredWorkflow: any = null;
try {
  // We'll attempt to load the workflow at runtime instead of compile-time
  console.log("Note: Will attempt to import workflow at runtime");
} catch (importError) {
  console.error("Failed to prepare for workflow import");
}

// Interfaces for type safety
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

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log(
    "[SendcloudWebhook] Received webhook:",
    JSON.stringify(req.body, null, 2)
  );

  try {
    // Try to dynamically import the workflow if needed
    if (!markFulfillmentAsDeliveredWorkflow) {
      try {
        const coreFlows = await import("@medusajs/medusa/core-flows");
        markFulfillmentAsDeliveredWorkflow = coreFlows.markFulfillmentAsDeliveredWorkflow;
        console.log("Successfully imported markFulfillmentAsDeliveredWorkflow at runtime");
      } catch (workflowImportError) {
        console.error("Failed to import workflow at runtime:", workflowImportError);
      }
    }

    // Resolve the Fulfillment Module Service
    const fulfillmentModuleService = req.scope.resolve(Modules.FULFILLMENT);
    console.log("Successfully resolved Fulfillment Module Service.");

    // Extract data from the webhook payload
    const payload = req.body as SendcloudWebhookPayload;
    const action = get(payload, 'action');
    const parcel = get(payload, 'parcel');
    const trackingNumber = get(parcel, 'tracking_number');
    const statusMessage = get(parcel, 'status.message');

    if (!action || !parcel || !trackingNumber || !statusMessage) {
      console.error("Webhook payload is missing required properties.");
      return res.status(200).json({ success: false, message: "Invalid payload structure." });
    }

    console.log(`Action: ${action}, Tracking: ${trackingNumber}, Status: ${statusMessage}`);

    // Find the corresponding Medusa Fulfillment
    let medusaFulfillmentId: string | undefined = undefined;
    let foundFulfillment: any | undefined = undefined;

    try {
      const providerId = 'sendcloud_sendcloud';
      console.log(`Listing fulfillments with provider_id '${providerId}' to find tracking number: ${trackingNumber}`);

      const fulfillmentsFromProvider = await fulfillmentModuleService.listFulfillments(
        { provider_id: [providerId] },
        { relations: ["labels", "metadata"] }
      );

      console.log(`Found ${fulfillmentsFromProvider.length} fulfillments from provider '${providerId}'.`);

      // Search within the 'labels' array
      for (const fulfillment of fulfillmentsFromProvider) {
        const labels = get(fulfillment, 'labels');

        if (Array.isArray(labels)) {
          const matchingLabel = labels.find(
            (label: any) => get(label, 'tracking_number') === trackingNumber
          );

          if (matchingLabel) {
            console.log(`Found matching Medusa fulfillment ID: ${fulfillment.id}`);
            medusaFulfillmentId = fulfillment.id;
            foundFulfillment = fulfillment;
            break;
          }
        }
      }

      if (!medusaFulfillmentId) {
        console.warn(`No Medusa fulfillment found for tracking number: ${trackingNumber}`);
      }

    } catch (listError) {
      const errorMessage = listError instanceof Error ? listError.message : String(listError);
      console.error("Error trying to list fulfillments:", errorMessage);
    }

    // Process the webhook based on the found fulfillment
    if (medusaFulfillmentId && foundFulfillment) {
      if (action === "parcel_status_changed") {
        console.log(`Processing status change for Medusa fulfillment ${medusaFulfillmentId} to ${statusMessage}`);

        if (statusMessage.toLowerCase() === "delivered") {
          // Only try to use the workflow if we successfully imported it
          if (markFulfillmentAsDeliveredWorkflow) {
            try {
              const workflowInput = { id: medusaFulfillmentId };
              console.log(`Triggering 'markFulfillmentAsDeliveredWorkflow' for fulfillment ${medusaFulfillmentId}...`);
              await markFulfillmentAsDeliveredWorkflow(req.scope).run({ input: workflowInput });
              console.log(`Workflow completed for fulfillment ${medusaFulfillmentId}`);
            } catch (workflowError) {
              const errorMessage = workflowError instanceof Error ? workflowError.message : String(workflowError);
              console.error(`Error running workflow for ${medusaFulfillmentId}:`, errorMessage);
            }
          } else {
            console.log(`Cannot mark fulfillment ${medusaFulfillmentId} as delivered: workflow import failed`);
          }
        } else {
          console.log(`Updating metadata for status '${statusMessage}' on fulfillment ${medusaFulfillmentId}`);
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