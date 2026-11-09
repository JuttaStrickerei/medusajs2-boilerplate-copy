"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { AUTH_ERRORS, authErrorMessage } from "@lib/util/auth-errors"
import { HttpTypes } from "@medusajs/types"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  clearWishlistMergePending,
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  getResetPasswordToken,
  removeAuthToken,
  removeCartId,
  removeResetPasswordToken,
  setAuthToken,
  setWishlistMergePending,
} from "./cookies"

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders) return null

    const headers = {
      ...authHeaders,
    }

    const next = {
      ...(await getCacheOptions("customers")),
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          fields: "*orders",
        },
        headers,
        next,
        cache: "force-cache",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }
  // Nur ein Token, das dieser Versuch gesetzt hat, wird bei Fehlern wieder
  // entfernt (sonst hinge ein halbes Konto ohne Kundendaten im Cookie)
  let tokenSet = false

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    await setAuthToken(token as string)
    tokenSet = true

    const headers = {
      ...(await getAuthHeaders()),
    }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    await setAuthToken(loginToken as string)

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)
    revalidatePath("/", "layout")

    await transferCart()

    // Flag guest-wishlist auto-merge for the client-side prompt component.
    // Brand-new account created from this browser = high confidence same user,
    // so no banner — prompt runs the merge silently.
    await setWishlistMergePending("auto")

    return createdCustomer
  } catch (error: any) {
    if (tokenSet) {
      await removeAuthToken()
    }
    // Medusa meldet sich auf Englisch („Identity with email already exists“)
    return authErrorMessage(error)
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const redirectUrl = formData.get("redirect_url") as string | null

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then(async (token) => {
        await setAuthToken(token as string)
        const customerCacheTag = await getCacheTag("customers")
        revalidateTag(customerCacheTag)
        revalidatePath("/", "layout")
      })
  } catch (error: any) {
    // z. B. „Invalid email or password“ → deutscher Satz
    return authErrorMessage(error)
  }

  try {
    await transferCart()
  } catch (error: any) {
    return authErrorMessage(error)
  }

  // Flag guest-wishlist merge prompt for the client. Login may happen on a
  // shared device, so the prompt asks the user before mixing items in.
  // Must be set BEFORE the redirect() call (which throws).
  await setWishlistMergePending("prompt")

  // Smart redirect: If redirect_url is provided, redirect there instead of account page
  // Security: Only allow internal redirects (paths starting with / but not //)
  if (
    redirectUrl &&
    redirectUrl.startsWith("/") &&
    !redirectUrl.startsWith("//")
  ) {
    redirect(redirectUrl)
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("cart")
  revalidateTag(cartCacheTag)

  // Clear any pending wishlist merge flag — the client-side provider
  // also wipes the localStorage wishlist key on the auth→guest transition.
  await clearWishlistMergePending()

  // Force the root layout to re-read cookies so WishlistProvider flips to guest mode.
  revalidatePath("/", "layout")

  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("cart")
  revalidateTag(cartCacheTag)
}

// ---------------------------------------------------------------------------
// Passwort vergessen (Medusa-Standard)
// 1. requestPasswordReset: Medusa erzeugt ein Token (15 Minuten gültig) und
//    löst „auth.password_reset“ aus; der Subscriber im Backend schickt die Mail.
// 2. Der Link führt über /api/reset-password (Token ins Cookie) auf
//    /<land>/reset-password.
// 3. resetPassword: setzt das neue Passwort mit diesem Token.
// ---------------------------------------------------------------------------

export type PasswordFormState = {
  success: boolean
  error: string | null
}

export async function requestPasswordReset(
  _currentState: PasswordFormState,
  formData: FormData
): Promise<PasswordFormState> {
  const email = ((formData.get("email") as string) || "").trim()

  if (!email) {
    return { success: false, error: "Bitte geben Sie Ihre E-Mail-Adresse ein." }
  }

  try {
    // Medusa antwortet immer mit Erfolg, auch wenn es kein Konto gibt. So
    // verrät das Formular nicht, welche Adressen bei uns ein Konto haben.
    await sdk.auth.resetPassword("customer", "emailpass", {
      identifier: email,
    })
  } catch (error) {
    return { success: false, error: authErrorMessage(error) }
  }

  return { success: true, error: null }
}

export async function resetPassword(
  _currentState: PasswordFormState,
  formData: FormData
): Promise<PasswordFormState> {
  const password = (formData.get("password") as string) || ""
  const passwordConfirm = (formData.get("password_confirm") as string) || ""

  // Ein leeres Passwort nimmt Medusa ohne Fehler hin und ändert nichts
  if (!password.trim()) {
    return { success: false, error: "Bitte geben Sie ein neues Passwort ein." }
  }

  if (password !== passwordConfirm) {
    return { success: false, error: AUTH_ERRORS.PASSWORDS_DIFFER }
  }

  const token = await getResetPasswordToken()

  if (!token) {
    return { success: false, error: AUTH_ERRORS.RESET_LINK_INVALID }
  }

  try {
    await sdk.auth.updateProvider("customer", "emailpass", { password }, token)
  } catch (error: any) {
    // 401: Token abgelaufen oder ungültig
    if (error?.status === 401) {
      await removeResetPasswordToken()
      return { success: false, error: AUTH_ERRORS.RESET_LINK_INVALID }
    }
    return { success: false, error: authErrorMessage(error) }
  }

  await removeResetPasswordToken()

  return { success: true, error: null }
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async ({ customer }) => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string

  if (phone) {
    address.phone = phone
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}
