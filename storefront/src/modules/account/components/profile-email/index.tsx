"use client"

import React from "react"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

// Die E-Mail-Adresse ist die Anmeldung. Medusa lässt Kundinnen sie im Shop
// nicht selbst ändern. Früher gab es hier „Bearbeiten“, das Speichern war aber
// abgeschaltet: Die Kundin sah „erfolgreich aktualisiert“, geändert wurde
// nichts. Jetzt nur Anzeige mit Hinweis, wie es trotzdem geht.
const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  return (
    <div className="text-sm" data-testid="account-email-editor">
      <span className="text-xs text-stone-500 uppercase tracking-wider">
        E-Mail
      </span>
      <div className="mt-1">
        <span className="font-medium text-stone-800" data-testid="current-info">
          {customer.email}
        </span>
      </div>
      <p className="mt-2 text-stone-600" data-testid="email-change-hint">
        Mit dieser Adresse melden Sie sich an. Möchten Sie sie ändern? Rufen
        Sie uns an unter{" "}
        <a
          href="tel:+4326862259"
          className="text-stone-800 underline underline-offset-2"
        >
          +43 2686 2259
        </a>{" "}
        oder schreiben Sie an{" "}
        <a
          href="mailto:office@strickerei-jutta.at"
          className="text-stone-800 underline underline-offset-2"
        >
          office@strickerei-jutta.at
        </a>
        .
      </p>
    </div>
  )
}

export default ProfileEmail
