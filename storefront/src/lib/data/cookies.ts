import "server-only"
import { cookies as nextCookies } from "next/headers"

export const getAuthHeaders = async (): Promise<
  { authorization: string } | {}
> => {
  try {
    const cookies = await nextCookies()
    const token = cookies.get("_medusa_jwt")?.value

    if (!token) {
      return {}
    }

    return { authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const cookies = await nextCookies()
    return Boolean(cookies.get("_medusa_jwt")?.value)
  } catch {
    return false
  }
}

export const getCacheTag = async (tag: string): Promise<string> => {
  try {
    const cookies = await nextCookies()
    const cacheId = cookies.get("_medusa_cache_id")?.value

    if (!cacheId) {
      return ""
    }

    return `${tag}-${cacheId}`
  } catch (error) {
    return ""
  }
}

export const getCacheOptions = async (
  tag: string
): Promise<{ tags: string[] } | {}> => {
  if (typeof window !== "undefined") {
    return {}
  }

  const cacheTag = await getCacheTag(tag)

  if (!cacheTag) {
    return {}
  }

  return { tags: [`${cacheTag}`] }
}

export const setAuthToken = async (token: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", "", {
    maxAge: -1,
  })
}

export const getCartId = async () => {
  const cookies = await nextCookies()
  return cookies.get("_medusa_cart_id")?.value
}

export const setCartId = async (cartId: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", cartId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", "", {
    path: "/",
    maxAge: -1,
  })
}

// Wishlist merge-pending flag.
// Set by login()/signup() after auth success; read + cleared by the
// client-side merge prompt once the user has made a decision.
//
// Mode values:
//   - "auto"   → registered this session; client merges without prompting
//   - "prompt" → logged in; client shows opt-in banner before merging
export type WishlistMergeMode = "auto" | "prompt"

export const setWishlistMergePending = async (mode: WishlistMergeMode) => {
  const cookies = await nextCookies()
  cookies.set("_wishlist_merge_pending", mode, {
    path: "/",
    maxAge: 60 * 60 * 24,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  })
}

export const getWishlistMergePending =
  async (): Promise<WishlistMergeMode | null> => {
    try {
      const cookies = await nextCookies()
      const value = cookies.get("_wishlist_merge_pending")?.value
      if (value === "auto" || value === "prompt") return value
      return null
    } catch {
      return null
    }
  }

export const clearWishlistMergePending = async () => {
  const cookies = await nextCookies()
  cookies.set("_wishlist_merge_pending", "", {
    path: "/",
    maxAge: -1,
  })
}
