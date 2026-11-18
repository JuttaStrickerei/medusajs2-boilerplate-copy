"use server"

import { sdk } from "@lib/config"

export const subscribeToNewsletter = async (email: string) => {
  const result = await sdk.client.fetch<{ 
    success: boolean
    message?: string
    alreadySubscribed?: boolean
    notSubscribed?: boolean
    signupUrl?: string
  }>(`/store/newsletter`, {
    method: "POST",
    body: {
      email,
    },
  })

  return result
}

