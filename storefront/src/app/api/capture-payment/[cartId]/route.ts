import { NextRequest, NextResponse } from "next/server";
import { sdk } from "@lib/config"; // Adjust import path for your Medusa SDK client instance
import { getAuthHeaders } from "@lib/data/cookies"; // Adjust import path if needed

type Params = Promise<{ cartId: string }>;

// Helper function for server-side cart retrieval WITH error logging
async function retrieveCartForApiRoute(cartId: string) {
  if (!cartId) {
    console.error("[API retrieveCart] No cartId provided.");
    return null;
  }
  console.log(`[API retrieveCart] Attempting retrieval for: ${cartId}`);
  try {
    // Use the SDK instance directly, passing the correct cartId
    // Add auth headers if required by your backend setup for this call
    const { cart } = await sdk.store.cart.retrieve(
      cartId,
      {},
      { ...getAuthHeaders() }
    );
    console.log(`[API retrieveCart] Found cart: ${cart?.id}`);
    return cart;
  } catch (error: any) {
    console.error(`[API retrieveCart] Failed to retrieve cart ${cartId}:`, error);
    if (error.response) {
      // Log details if it's an Axios/fetch error
      console.error(`[API retrieveCart] Status: ${error.response.status}`);
      console.error(`[API retrieveCart] Data:`, error.response.data);
    } else {
      console.error(`[API retrieveCart] Message:`, error.message);
    }
    return null; // Return null specifically on failure
  }
}

// New function for placing orders from API route
async function placeOrderFromApiRoute(cartId: string) {
  if (!cartId) {
    throw new Error("No cartId provided when placing an order");
  }

  console.log(`[API placeOrder] Attempting to complete order for cart: ${cartId}`);

  try {
    // Use direct SDK call without redirect or removal logic
    const cartRes = await sdk.store.cart.complete(
      cartId,
      {},
      getAuthHeaders()
    );

    console.log(`[API placeOrder] Order completion result type: ${cartRes?.type}`);

    // Return the entire response to preserve the type property
    return cartRes;
  } catch (error: any) {
    console.error(`[API placeOrder] Failed to complete order for cart ${cartId}:`, error);
    if (error.response) {
      console.error(`[API placeOrder] Status: ${error.response.status}`);
      console.error(`[API placeOrder] Data:`, error.response.data);
    } else {
      console.error(`[API placeOrder] Message:`, error.message);
    }
    throw error;
  }
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { cartId } = await params;
  const { origin, searchParams, href } = req.nextUrl; // Keep origin for fallback/logging if needed

  // *** Use the environment variable for the base URL ***
  // Provide a fallback to origin, although the ENV var SHOULD be set in prod.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin;

  console.log("API Route: Full incoming URL:", href); // Log the full URL
  console.log("API Route: Received cartId:", cartId); // Log received ID
  console.log("API Route: Using base URL for redirects:", baseUrl); // Log the base URL being used

  const paymentIntent = searchParams.get("payment_intent");
  const paymentIntentClientSecret = searchParams.get(
    "payment_intent_client_secret"
  );
  const redirectStatus = searchParams.get("redirect_status") || "";
  const countryCode = searchParams.get("country_code");

  console.log("API Route: Extracted countryCode:", countryCode); // Log extracted country code

  // Fallback if countryCode is somehow missing - redirect to base URL root
  if (!countryCode) {
    console.warn("API Route: country_code missing from query parameters. Redirecting to base URL root.");
    return NextResponse.redirect(baseUrl); // Redirect to base site URL if country code is missing
  }

  // *** Use the new function that accepts cartId ***
  const cart = await retrieveCartForApiRoute(cartId);

  console.log("API Route: Cart retrieved:", cart ? cart.id : "Not Found"); // Log result

  if (!cart) {
    console.log("API Route: Cart not found via API retrieval, redirecting to country home.");
    // *** Use baseUrl for redirect ***
    return NextResponse.redirect(`${baseUrl}/${countryCode}`);
  }

  // --- Rest of your validation logic ---
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (payment) => payment.data.id === paymentIntent
  );

  if (
    !paymentSession ||
    paymentSession.data.client_secret !== paymentIntentClientSecret ||
    !["pending", "succeeded"].includes(redirectStatus) || // Double-check if 'pending' is expected here
    !["pending", "authorized"].includes(paymentSession.status)
  ) {
    console.warn("API Route: Payment validation failed. Details:", {
      paymentSessionExists: !!paymentSession,
      clientSecretMatch:
        paymentSession?.data.client_secret === paymentIntentClientSecret,
      redirectStatusValid: ["pending", "succeeded"].includes(redirectStatus),
      paymentSessionStatusValid: ["pending", "authorized"].includes(
        paymentSession?.status ?? ""
      ),
      redirectStatus: redirectStatus,
      paymentSessionStatus: paymentSession?.status,
    });
    // *** Use baseUrl for redirect ***
    return NextResponse.redirect(
      `${baseUrl}/${countryCode}/cart?step=review&error=payment_failed`
    );
  }

  console.log("API Route: Payment validation successful. Placing order...");

  // --- Place Order with new function ---
  try {
    const cartRes = await placeOrderFromApiRoute(cartId);

    // Check if result is an order or still a cart using the type property
    if (cartRes?.type === "order") {
      console.log("API Route: Order placed successfully:", cartRes.order.id);
      // *** Use baseUrl for redirect ***
      const redirectUrl = `${baseUrl}/${countryCode}/order/confirmed/${cartRes.order.id}`;
      console.log("API Route: Redirecting to confirmation:", redirectUrl);
      return NextResponse.redirect(redirectUrl);
    } else {
      console.log("API Route: Cart was returned instead of an order:", cartRes?.cart?.id ?? "N/A");
      // *** Use baseUrl for redirect ***
      const redirectUrl = `${baseUrl}/${countryCode}/cart?step=review&error=order_not_completed`;
      console.log("API Route: Redirecting back to cart (order not completed):", redirectUrl);
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error: any) {
    console.error("API Route: Failed to place order:", error);
    if (error.response) {
      console.error(`API Route: Place Order Status: ${error.response.status}`);
      console.error(`API Route: Place Order Data:`, error.response.data);
    } else {
      console.error(`API Route: Place Order Message:`, error.message);
    }
    // Redirect to an error page or back to cart
    // *** Use baseUrl for redirect ***
    const redirectUrl = `${baseUrl}/${countryCode}/cart?step=review&error=order_placement_failed`;
    console.log("API Route: Redirecting back to cart (order placement failed):", redirectUrl);
    return NextResponse.redirect(redirectUrl);
  }
}