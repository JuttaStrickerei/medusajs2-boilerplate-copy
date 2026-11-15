// Gutschein, der über einen Link mitkommt (?gutschein=CODE, z. B. aus der
// Willkommens-Mail oder einer Anzeige). Der Shop merkt ihn sich im Browser und
// löst ihn im Warenkorb einmal von selbst ein (discount-code). Niemand muss tippen.

/** Parameter in der Adresse, z. B. /at?gutschein=WILLKOMMEN-AB12CD34 */
export const VOUCHER_PARAM = "gutschein"

const STORAGE_KEY = "jutta_gutschein"
const CODE_SHAPE = /^[A-Za-z0-9][A-Za-z0-9-]{2,39}$/

export const isVoucherCode = (value?: string | null): value is string =>
  !!value && CODE_SHAPE.test(value.trim())

export function savePendingVoucher(code: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, code.trim())
  } catch {
    // Speicher gesperrt (privates Fenster): Der Code lässt sich weiter von Hand eingeben
  }
}

export function readPendingVoucher(): string | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return isVoucherCode(value) ? value.trim() : null
  } catch {
    return null
  }
}

export function clearPendingVoucher() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // nichts zu tun
  }
}
