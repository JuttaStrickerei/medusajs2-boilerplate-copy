// Bare minimum webhook with only Express types
export const POST = async (req, res) => {
    console.log("Webhook received");
    return res.status(200).json({ success: true });
  };
  
  // Disable CORS and authentication for this endpoint
  export const CORS = false;
  export const AUTHENTICATE = false;