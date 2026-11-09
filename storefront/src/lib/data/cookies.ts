import "server-only"
import { cookies as nextCookies } from "next/headers"

// Login-Cookie höchstens 7 Tage
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

// Ablaufzeit (ms) aus dem Medusa-Login-Token (JWT, Feld „exp“). Nur gelesen,
// nicht geprüft: Ob das Token echt ist, entscheidet das Backend.
// undefined = Token ohne Ablaufzeit, null = kein lesbares Token
const tokenExpiresAt = (token: string): number | null | undefined => {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8")
    )
    return typeof payload.exp === "number" ? payload.exp * 1000 : undefined
  } catch {
    return null
  }
}

// Medusa meldet Kundinnen nach Ablauf des Tokens ab (bei uns 7 Tage, siehe
// backend/medusa-config.js jwtExpiresIn; Medusa-Standard wäre 1 Tag), das
// Cookie lebte aber 7 Tage. Dazwischen hielt der Shop sie für angemeldet.
// Ein abgelaufenes Token zählt darum hier wie kein Token.
const getValidAuthToken = async (): Promise<string | null> => {
  try {
    const cookies = await nextCookies()
    const token = cookies.get("_medusa_jwt")?.value

    if (!token) {
      return null
    }

    const expiresAt = tokenExpiresAt(token)
    if (expiresAt === null || (expiresAt && expiresAt <= Date.now())) {
      return null
    }

    return token
  } catch {
    return null
  }
}

export const getAuthHeaders = async (): Promise<
  { authorization: string } | {}
> => {
  const token = await getValidAuthToken()

  if (!token) {
    return {}
  }

  return { authorization: `Bearer ${token}` }
}

export const isAuthenticated = async (): Promise<boolean> => {
  return Boolean(await getValidAuthToken())
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
  // Cookie läuft mit dem Token ab (nie länger als 7 Tage)
  const expiresAt = tokenExpiresAt(token)
  const maxAge = expiresAt
    ? Math.max(
        0,
        Math.min(AUTH_COOKIE_MAX_AGE, Math.floor((expiresAt - Date.now()) / 1000))
      )
    : AUTH_COOKIE_MAX_AGE
  cookies.set("_medusa_jwt", token, {
    maxAge,
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

// Passwort-Link aus der E-Mail.
// /api/reset-password legt das Token hier ab und leitet auf eine Seite ohne
// Token in der Adresse weiter. So landet es nie in Seitenaufrufen, die
// Google Analytics oder der Meta-Pixel mitschicken. „lax“, weil der Klick aus
// dem Mailprogramm von außen kommt (bei „strict“ fehlte das Cookie nach der
// Weiterleitung). Gültig 15 Minuten wie das Token selbst.
const RESET_TOKEN_COOKIE = "_jutta_reset_token"

export const setResetPasswordToken = async (token: string) => {
  const cookies = await nextCookies()
  cookies.set(RESET_TOKEN_COOKIE, token, {
    path: "/",
    maxAge: 60 * 15,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

export const getResetPasswordToken = async (): Promise<string | null> => {
  try {
    const cookies = await nextCookies()
    return cookies.get(RESET_TOKEN_COOKIE)?.value || null
  } catch {
    return null
  }
}

export const removeResetPasswordToken = async () => {
  const cookies = await nextCookies()
  cookies.set(RESET_TOKEN_COOKIE, "", {
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
