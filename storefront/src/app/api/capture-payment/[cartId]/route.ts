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
  { params }: { params: Promise<{ cartId: string }> }
) {
  const { cartId } = await params

  try {
    // Attempt to complete the cart using the Medusa JS SDK.
    const response = await sdk.store.cart.complete(cartId)

    // Log the full response for easier debugging in the future.
    console.log("Full response from sdk.store.cart.complete:", response)

    // Check if cart completion was successful and an order was created.
    if (response && response.type === "order" && response.order) {
      const { order } = response

      // Reliably get the country_code from the incoming request's URL.
      const countryCode = req.nextUrl.searchParams.get("country_code")
      console.log("Country code is:", countryCode)

      // CRITICAL: The cart ID cookie must be deleted upon successful
      // order placement to prevent the "cart already completed" error.
      const cookieStore = await cookies()
      cookieStore.set("_medusa_cart_id", "", { maxAge: -1 })

      // Redirect the user to the order confirmation page.
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"

      // Ensure we have an order ID to redirect to.
      if (order.id) {
        // Use the country code from the URL for a localized redirect.
        // Note: Samuel's route structure is /order/[id]/confirmed
        if (countryCode) {
          return NextResponse.redirect(
            `${baseUrl}/${countryCode}/order/${order.id}/confirmed`
          )
        } else {
          return NextResponse.redirect(`${baseUrl}/order/${order.id}/confirmed`)
        }
      } else {
        console.warn("Order ID was missing after successful cart completion.")
        return NextResponse.redirect(`${baseUrl}/`)
      }
    } else {
      console.error("Cart completion did not return an order. Response:", response)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
      return NextResponse.redirect(
        `${baseUrl}/checkout?error=payment_completion_failed`
      )
    }
  } catch (error) {
    console.error("Error completing cart in capture-payment route:", error)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
    return NextResponse.redirect(
      `${baseUrl}/checkout?error=payment_completion_error`
    )
  }
}
