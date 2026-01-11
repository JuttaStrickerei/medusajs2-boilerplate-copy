import LoginTemplate from "@modules/account/templates/login-template"

type Props = {
  searchParams: Promise<{ redirect_url?: string }>
}

export default async function LoginDefault({ searchParams }: Props) {
  const params = await searchParams
  const redirectUrl = params.redirect_url

  return <LoginTemplate redirectUrl={redirectUrl} />
}

