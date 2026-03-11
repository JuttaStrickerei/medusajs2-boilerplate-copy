/**
 * Lightweight custom event system for auth state changes.
 * Server Actions can't dispatch browser events, so the calling
 * client components dispatch these after successful login/logout.
 */

export const AUTH_LOGIN_EVENT = "auth:login"
export const AUTH_LOGOUT_EVENT = "auth:logout"

export function dispatchAuthLogin() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_LOGIN_EVENT))
  }
}

export function dispatchAuthLogout() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT))
  }
}

export function onAuthLogin(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(AUTH_LOGIN_EVENT, handler)
  return () => window.removeEventListener(AUTH_LOGIN_EVENT, handler)
}

export function onAuthLogout(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(AUTH_LOGOUT_EVENT, handler)
  return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler)
}
