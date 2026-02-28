"use client"

/**
 * Button to re-open cookie preferences modal.
 * Place this in the footer next to Impressum/Datenschutz links.
 *
 * German: "Cookie-Einstellungen"
 */
export function CookieSettingsButton(): React.ReactElement {
  const handleClick = (): void => {
    // Dynamically import to access the showPreferences method
    import("vanilla-cookieconsent").then((CookieConsent) => {
      CookieConsent.showPreferences()
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-sm text-stone-400 hover:text-white transition-colors"
    >
      Cookie-Einstellungen
    </button>
  )
}

/**
 * English variant for international users.
 */
export function CookieSettingsButtonEn(): React.ReactElement {
  const handleClick = (): void => {
    import("vanilla-cookieconsent").then((CookieConsent) => {
      CookieConsent.showPreferences()
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-sm text-stone-400 hover:text-white transition-colors"
    >
      Cookie Settings
    </button>
  )
}
