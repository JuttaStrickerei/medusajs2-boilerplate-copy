import { NextRequest, NextResponse } from "next/server"
import { setResetPasswordToken } from "@lib/data/cookies"

/**
 * @name GET /api/reset-password?token=…
 * @description Ziel des Links in der Mail „Passwort zurücksetzen“.
 * Legt das Token in ein kurzlebiges httpOnly-Cookie und leitet auf
 * /<land>/reset-password weiter. Die Seite selbst hat damit kein Token (und
 * keine E-Mail-Adresse) in der Adresse, also schicken Google Analytics und der
 * Meta-Pixel beim Seitenaufruf auch keins mit. Hier läuft kein Tracking: die
 * Antwort ist nur eine Weiterleitung.
 */

// Medusa-Token sind JWTs: drei Base64url-Teile, durch Punkte getrennt
const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? ""

  if (token.length < 4096 && JWT_PATTERN.test(token)) {
    await setResetPasswordToken(token)
  }

  // Relative Weiterleitung: hinter dem Railway-Proxy ist die interne Adresse
  // nicht die öffentliche
  const countryCode = process.env.NEXT_PUBLIC_DEFAULT_REGION || "at"

  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: `/${countryCode}/reset-password`,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  })
}
