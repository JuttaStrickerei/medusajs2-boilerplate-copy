// Deutsche Fehlermeldungen für Anmeldung, Registrierung und Passwort.
//
// Medusa schickt seine Fehler auf Englisch („Identity with email already
// exists“, „Invalid email or password“ …). Der Shop ist nur deutsch, es gibt
// keinen Sprachumschalter. Darum werden die bekannten Fälle hier übersetzt;
// alles Unbekannte bekommt einen allgemeinen deutschen Satz statt des
// englischen Originals.

export const AUTH_ERRORS = {
  EMAIL_EXISTS:
    "Mit dieser E-Mail-Adresse gibt es bereits ein Konto. Bitte melden Sie sich an. Falls Sie Ihr Passwort nicht mehr wissen, können Sie es zurücksetzen.",
  WRONG_LOGIN:
    "E-Mail-Adresse oder Passwort stimmen nicht. Bitte prüfen Sie Ihre Eingabe.",
  MISSING_FIELDS: "Bitte geben Sie Ihre E-Mail-Adresse und ein Passwort ein.",
  ALREADY_LOGGED_IN:
    "Sie sind bereits angemeldet. Bitte laden Sie die Seite neu.",
  RESET_LINK_INVALID:
    "Der Link ist abgelaufen. Bitte fordern Sie einen neuen Link an.",
  PASSWORDS_DIFFER: "Die beiden Passwörter stimmen nicht überein.",
  UNREACHABLE:
    "Der Shop ist gerade nicht erreichbar. Bitte versuchen Sie es in ein paar Minuten noch einmal.",
  GENERIC:
    "Das hat leider nicht geklappt. Bitte versuchen Sie es noch einmal oder rufen Sie uns an: +43 2686 2259.",
} as const

// Englischer Medusa-Text (Ausschnitt) → deutsche Meldung
const KNOWN_ERRORS: Array<[RegExp, string]> = [
  [/identity with email already exists/i, AUTH_ERRORS.EMAIL_EXISTS],
  [/customer with email.*already exists/i, AUTH_ERRORS.EMAIL_EXISTS],
  [/invalid email or password/i, AUTH_ERRORS.WRONG_LOGIN],
  [/(email|password) should be a string/i, AUTH_ERRORS.MISSING_FIELDS],
  [/already authenticated/i, AUTH_ERRORS.ALREADY_LOGGED_IN],
  [/fetch failed|failed to fetch|econnrefused|network/i, AUTH_ERRORS.UNREACHABLE],
]

export function authErrorMessage(error: unknown): string {
  const text =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : ""

  for (const [pattern, message] of KNOWN_ERRORS) {
    if (pattern.test(text)) return message
  }

  return AUTH_ERRORS.GENERIC
}
