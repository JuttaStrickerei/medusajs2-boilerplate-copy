import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Medusa Store account.",
}

type Props = {
  searchParams: Promise<{ redirect_url?: string }>
}

export default async function Login({ searchParams }: Props) {
  const params = await searchParams
  const redirectUrl = params.redirect_url

  return <LoginTemplate redirectUrl={redirectUrl} />
}
