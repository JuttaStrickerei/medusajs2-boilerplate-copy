import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import Medusa from "@medusajs/js-sdk"

let MEDUSA_BACKEND_URL = "http://localhost:9000"
if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
} else if (process.env.MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL
}

const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

async function getAuthHeaders(): Promise<{ authorization: string } | Record<string, never>> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("_medusa_jwt")?.value
    if (!token) return {}
    return { authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export async function GET() {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return NextResponse.json({ wishlist_items: [] })
  }

  try {
    const data = await sdk.client.fetch<{ wishlist_items: unknown[] }>(
      "/store/wishlist",
      { method: "GET", headers }
    )
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API /api/wishlist GET] failed:", error)
    return NextResponse.json({ wishlist_items: [] })
  }
}

export async function POST(req: NextRequest) {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await req.json()
    await sdk.client.fetch("/store/wishlist", {
      method: "POST",
      headers,
      body,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API /api/wishlist POST] failed:", error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await req.json()
    await sdk.client.fetch("/store/wishlist", {
      method: "DELETE",
      headers,
      body,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API /api/wishlist DELETE] failed:", error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
