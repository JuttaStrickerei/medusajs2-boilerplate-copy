import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * @name POST /api/clear-cart-cookie
 * @description Server-side endpoint to clear the cart cookie.
 * Required because the cart cookie is httpOnly and cannot be cleared from client-side JavaScript.
 * This is called after successful order completion, especially important for off-site payments (Klarna, PayPal).
 */
export async function POST() {
  try {
    const cookieStore = await cookies()

    // Clear the cart cookie with the same attributes it was set with
    cookieStore.set("_medusa_cart_id", "", {
      path: "/",
      maxAge: -1,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing cart cookie:", error)
    return NextResponse.json({ success: false, error: "Failed to clear cart cookie" }, { status: 500 })
  }
}
