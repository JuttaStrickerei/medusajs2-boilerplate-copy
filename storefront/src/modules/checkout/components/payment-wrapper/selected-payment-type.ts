/**
 * Die im Payment Element gewählte Zahlungsart (card, apple_pay, google_pay, …).
 *
 * Der Schritt „Zahlung“ setzt sie in seinem onChange, dort wird gewählt. Der
 * Knopf „Zahlungspflichtig bestellen“ entsteht erst im Schritt „Übersicht“
 * und bekäme ein eigenes change-Ereignis nicht mehr mit, er liest nur von hier.
 * Ein einfaches Objekt statt React-State: Der Knopf braucht den Wert erst beim
 * Klick, ein Neuzeichnen ist dafür nicht nötig. Gilt je Browser-Tab.
 */
export const selectedPaymentType: { current: string | undefined } = {
  current: undefined,
}
