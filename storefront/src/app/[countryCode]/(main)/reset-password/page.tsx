import { Metadata } from "next"
import { getResetPasswordToken } from "@lib/data/cookies"
import ResetPassword from "@modules/account/components/reset-password"

export const metadata: Metadata = {
  title: "Neues Passwort",
  robots: { index: false, follow: false },
}

type TokenInfo = { email: string | null; expired: boolean }

// Liest E-Mail-Adresse und Ablaufzeit aus dem Token (nur zur Anzeige; ob das
// Token echt ist, prüft das Backend beim Speichern)
function readToken(token: string): TokenInfo {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8")
    )
    const email =
      typeof payload.entity_id === "string" && payload.entity_id.includes("@")
        ? payload.entity_id
        : null
    const expired =
      typeof payload.exp === "number" && payload.exp * 1000 < Date.now()
    return { email, expired }
  } catch {
    return { email: null, expired: true }
  }
}

export default async function ResetPasswordPage() {
  const token = await getResetPasswordToken()
  const info = token ? readToken(token) : null

  return (
    <div className="flex items-center justify-center py-12 px-4 bg-stone-50 min-h-[60vh]">
      <div className="w-full max-w-md">
        <ResetPassword
          tokenValid={!!info && !info.expired}
          email={info?.email ?? null}
        />
      </div>
    </div>
  )
}
