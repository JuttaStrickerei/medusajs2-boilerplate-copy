import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

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
    // Extract basic info from payload
    const action = get(req.body, 'action');
    const trackingNumber = get(req.body, 'parcel.tracking_number');
    const statusMessage = get(req.body, 'parcel.status.message');

    console.log(`Received webhook - Action: ${action}, Tracking: ${trackingNumber}, Status: ${statusMessage}`);

    // For now, just acknowledge receipt without processing
    return res.status(200).json({
      success: true,
      message: "Webhook received (basic implementation).",
      payload: req.body,
    });

  } catch (error) {
    console.error("[SendcloudWebhook] Error:", error);
    return res.status(200).json({
      success: false,
      message: `Error processing webhook: ${error instanceof Error ? error.message : String(error)}`,
      payload: req.body,
    });
  }
};

// Disable CORS and authentication for this endpoint
export const CORS = false;
export const AUTHENTICATE = false;