import { sdk } from "@lib/config"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

/**
 * This endpoint is invoked when a user is redirected back from a
 * third-party payment provider. It is responsible for completing the cart,
 * creating the order, and then redirecting the user to the final order
 * confirmation page.
 * @param req The incoming Next.js request.
 * @param params The route parameters, containing the cartId.
 * @returns A NextResponse that redirects the user.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { cartId: string } }
) {
  const { cartId } = params

  try {
    // Attempt to complete the cart using the Medusa JS SDK.
    const response = await sdk.store.cart.complete(cartId)

    // Log the full response for easier debugging in the future.
    console.log("Full response from sdk.store.cart.complete:", response)

    // Check if cart completion was successful and an order was created.
    // The key change is here: we check for `response.order` instead of `response.data`.
    if (response && response.type === "order" && response.order) {
      const { order } = response // Destructure to get the order object

      // Reliably get the country_code from the incoming request's URL.
      const countryCode = req.nextUrl.searchParams.get("country_code")
      console.log("Country code is:", countryCode)

      // CRITICAL: The cart ID cookie must be deleted upon successful
      // order placement to prevent the "cart already completed" error.
      cookies().set("_medusa_cart_id", "", { maxAge: -1 })

      // Redirect the user to the order confirmation page.
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"

      // Ensure we have an order ID to redirect to.
      if (order.id) {
        // Use the country code from the URL for a localized redirect.
        if (countryCode) {
          return NextResponse.redirect(
            `${baseUrl}/${countryCode}/order/confirmed/${order.id}`
          )
        } else {
          // Fallback if country code is missing from URL.
          return NextResponse.redirect(`${baseUrl}/order/confirmed/${order.id}`)
        }
      } else {
        // This is an edge case, but good to have a fallback.
        console.warn("Order ID was missing after successful cart completion.")
        return NextResponse.redirect(`${baseUrl}/`)
      }
    } else {
      // Handle cases where cart completion fails or returns an unexpected structure.
      console.error("Cart completion did not return an order. Response:", response)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
      return NextResponse.redirect(
        `${baseUrl}/checkout?error=payment_completion_failed`
      )
    }
  } catch (error) {
    // Log any exceptions that occur during the process.
    console.error("Error completing cart in capture-payment route:", error)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
    return NextResponse.redirect(
      `${baseUrl}/checkout?error=payment_completion_error`
    )
  }
}