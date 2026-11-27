# Apple Pay und Google Pay über Stripe (Phase 0 + 1)

Stand: 27.11.2026, Branch `feat/stripe-wallets`. Nicht im Umfang: Express-Checkout-Knöpfe (Warenkorb, Produktseite, Express Checkout Element), Payment Request Button, EPS (bewusst nicht gewünscht).

## Wie es funktioniert

- Apple Pay und Google Pay sind bei Stripe keine eigenen Zahlungsarten, sie laufen als `card` und kosten wie eine Kartenzahlung.
- Die Kasse nutzt seit dem 15.11.2026 schon das **Stripe Payment Element** im „deferred intent“-Modus: Elements kennt nur Betrag und Währung, der PaymentIntent entsteht erst beim Bestellen. Das Element zeigt **alles, was im Stripe-Dashboard aktiv ist** (dynamische Zahlungsarten). Wallets erscheinen, sobald sie im Dashboard aktiv sind, die Domain registriert ist und Gerät/Browser sie können.
- Ändert sich der Betrag (Gutschein, Versand, Menge), löscht Medusa die Zahlungssitzung. Elements bekommt den neuen Betrag per `elements.update`, die eingegebenen Daten bleiben stehen; der Knopf „Zahlungspflichtig bestellen“ legt die Sitzung bei Bedarf neu an. Ein Neuaufbau von Elements mit neuem `client_secret` ist dadurch nicht nötig.
- Die Stripe-SDKs (`@stripe/stripe-js` 1.54, `@stripe/react-stripe-js` 1.16, Stripe.js `js.stripe.com/v3`) bleiben bewusst unverändert. Ein Upgrade auf 10.x / 7.x (Stripe.js „Endive“) ist für Wallets nicht nötig und wäre ein eigenes Projekt mit Regressionstest aller Zahlungsarten.

### Klickablauf (§ 8 Abs 2 FAGG, Apple-Geste)

1. Schritt „Zahlung“: Die Kundin wählt im Payment Element z. B. Apple Pay. „Weiter zur Übersicht“ ruft **kein** `elements.submit()` mehr auf, es prüft nur, ob das Element vollständig ist. So öffnet sich hier noch kein Wallet-Fenster.
2. Schritt „Bestellung abschließen“: Positionen, Gesamtbetrag inkl. MwSt. und Versand, AGB, Widerrufsbelehrung und Datenschutz bleiben unverändert sichtbar.
3. Klick auf **„Zahlungspflichtig bestellen“**: `elements.submit()` ist der erste Aufruf im Klick, vor jedem `await`. Er öffnet das Apple-Pay- bzw. Google-Pay-Fenster. Während es offen ist, speichert der Shop die Meta-Zuordnung (höchstens 2 s) und legt bei Bedarf die Zahlungssitzung an. Danach `stripe.confirmPayment({ redirect: "if_required" })` und `placeOrder()`.
4. Schließt die Kundin das Wallet-Fenster, bleibt sie in der Übersicht und sieht: „Die Zahlung mit Apple Pay wurde nicht abgeschlossen. Sie können es noch einmal versuchen …“. Ein zweiter Klick öffnet das Fenster erneut.
5. Schließt sich der Browser nach der Freigabe (z. B. In-App-Browser), legt Medusa die Bestellung über den Stripe-Webhook an (`processPaymentWorkflow` → `completeCartAfterPaymentStep`, geprüft in `@medusajs/core-flows` 2.12.3).

> Noch am Gerät zu bestätigen: dass das Wallet-Fenster wirklich bei `elements.submit()` öffnet (Stripe schreibt nur „collect any data required for wallets“) und welchen Fehler `submit()` beim Schließen liefert. Die Meldung in Schritt 4 hängt an der gewählten Art (`apple_pay` / `google_pay` aus dem `change`-Ereignis des Payment Elements), nicht am Fehlercode.

## a) Manuelle Checkliste

### Stripe-Dashboard (Sandbox **und** Live)

- [x] Apple Pay und Google Pay aktiv (laut Andre am 27.11.2026 erledigt).
- [x] **Live (Konto `acct_1PQrts…`), Screenshot 27.11.2026:** EPS deaktiviert, PayPal „Aktiviert (benutzerdefiniert)“, Klarna aktiviert.
- [ ] **Sandbox angleichen** (nur für Tests auf dev wichtig): Die lokalen/dev-Testschlüssel gehören zu einer **eigenen Sandbox** (anderes Konto, eigene Einstellungen). Dort ist EPS aktiv und erscheint in der Kasse; Klarna und PayPal meldet Stripe.js dort als „not activated … hidden in live mode“. EPS dort ausschalten, sonst sieht der Gerätetest auf dev anders aus als live. Im Code lässt sich EPS nicht ausblenden, ohne `paymentMethodTypes` zu setzen (ab Stripe.js „Endive“ ein Fehler, daher bewusst nicht verwendet).
- [ ] **Standard-Konfiguration prüfen:** Die PaymentIntents nennen keine `payment_method_configuration`, Stripe nimmt also die **Standard**-Konfiguration. Gibt es live mehrere (`pmc_…`), muss die mit EPS aus / Wallets an die Standard-Konfiguration sein.
- [ ] Übrige aktive Zahlungsarten durchsehen: Der Shop bewirbt Visa, Mastercard, PayPal und Klarna (`shop-facts.ts`, FAQ). Alles andere, das aktiv ist (Link, Sofort, giropay …), erscheint ebenfalls in der Kasse. Entweder ausschalten oder FAQ/Symbole ergänzen.
- [ ] **Zahlungsmethoden-Domains** registrieren (Einstellungen → Zahlungsmethoden → Zahlungsmethoden-Domains). Pflicht für Apple Pay und Google Pay im Payment Element:
  - Live: `shop.strickerei-jutta.at`, zusätzlich `www.shop.strickerei-jutta.at` nur falls verwendet.
  - Sandbox: die feste Railway-Domain des **dev**-Storefronts. In Live registrierte Domains gelten laut Stripe automatisch auch in den Sandboxen; die dev-Domain muss in der Sandbox selbst eingetragen werden.
  - Railway-Vorschau-URLs je Deployment zeigen nie Wallets. `localhost` (HTTP) auch nicht.
  - Eine Datei `/.well-known/apple-developer-merchantid-domain-association` und ein Apple-Developer-Konto sind nicht nötig; Stripe übernimmt die Händlerprüfung.

### Webhook (Sandbox und Live je einmal)

- Endpoint: `https://<Backend-Domain>/hooks/payment/stripe_stripe`
- Ereignisse mindestens: `payment_intent.amount_capturable_updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.partially_funded`. Der Provider wertet zusätzlich `payment_intent.created`, `.processing`, `.canceled`, `.requires_action` aus; schaden tun sie nicht.
- Das Signing-Secret des Endpoints (`whsec_…`) gehört in `STRIPE_WEBHOOK_SECRET` des jeweiligen Backends.
- Prüfen: Im Dashboard unter Webhooks zeigt der Endpoint 2xx-Antworten. Fehlt das Secret, lädt Medusa Stripe gar nicht; das Backend schreibt dann beim Start `[medusa-config] STRIPE_API_KEY ist gesetzt, STRIPE_WEBHOOK_SECRET fehlt …` ins Log.

### Railway-Variablen

| Dienst | Variable | dev | prod |
|---|---|---|---|
| Backend | `STRIPE_API_KEY` | `sk_test_…` | `sk_live_…` |
| Backend | `STRIPE_WEBHOOK_SECRET` | Secret des Sandbox-Webhooks | Secret des Live-Webhooks |
| Storefront | `NEXT_PUBLIC_STRIPE_KEY` | `pk_test_…` | `pk_live_…` |

`NEXT_PUBLIC_STRIPE_KEY` wird beim **Build** eingebaut; nach einer Änderung braucht der Storefront einen neuen Build. Keine neuen Variablen nötig.

### Lokal (Claude-Code-Umgebung)

- In `.claude/settings.local.json` steht eine veraltete `RAILWAY_API_TOKEN`. Sie überlagert `railway login` und lässt CLI und Railway-MCP mit „Unauthorized“ scheitern. Entfernen oder erneuern.

## b) Testplan

Voraussetzungen:

- **HTTPS** auf einer registrierten Domain: dev-Storefront auf Railway (mit Sandbox-Schlüsseln) oder ein HTTPS-Tunnel, dessen Domain in der Sandbox registriert ist. Auf `http://localhost` erscheinen keine Wallets.
- Eine **echte Karte** in Apple Wallet bzw. Google Pay. Stripe-Testkarten lassen sich nicht ins Wallet legen; mit Test-Schlüsseln wird die echte Karte nicht belastet.
- Kein Inkognito-/Privatfenster (dort zeigen Browser oft keine Wallets).

Gerätematrix (je: Wallet sichtbar? Bestellung entsteht? Bestätigungsseite?):

| | Apple Pay | Google Pay |
|---|---|---|
| iPhone Safari | ☐ | – |
| Android Chrome | – | ☐ |
| Mac Safari | ☐ | – |
| Desktop Chrome (Mac/Windows) | ☐ (Chrome auf macOS/iOS kann Apple Pay anbieten) | ☐ |
| Instagram-In-App (iOS / Android) | ☐ | ☐ |
| TikTok-In-App (iOS / Android) | ☐ | ☐ |
| WhatsApp-In-App (iOS / Android) | ☐ | ☐ |

Google Pay in Android-In-App-Browsern ist die größte Unbekannte. Zeigt ein In-App-Browser kein Wallet, ist das kein Fehler: Die Kundin zahlt dann mit Karte, PayPal oder Klarna.

Fehlerfälle:

- [ ] Wallet-Fenster freigeben und sofort die App/den Tab schließen → Bestellung entsteht trotzdem (Webhook). Im Admin prüfen.
- [ ] Wallet-Fenster schließen (abbrechen) → Meldung in der Übersicht, zweiter Klick öffnet das Fenster wieder, keine doppelte Bestellung.
- [ ] Nach dem Schritt „Zahlung“ Gutschein einlösen und Versandart ändern → Betrag im Wallet-Fenster stimmt mit dem neuen Gesamtbetrag überein.
- [ ] „Weiter zur Übersicht“ mit Apple Pay gewählt → **kein** Wallet-Fenster.
- [ ] Doppelklick/Doppeltipp auf „Zahlungspflichtig bestellen“ → nur ein Wallet-Fenster, eine Zahlung.
- [ ] Abgelehnte Karte (`4000 0000 0000 0002`) → deutsche Meldung, Kundin bleibt in der Übersicht.
- [ ] 3-D-Secure (`4000 0027 6000 3184`) → Abfrage erscheint, danach Bestellung.
- [ ] Klarna oder PayPal: auf der Seite des Anbieters abbrechen → Rückkehr auf `/at/complete-payment`, deutsche Meldung „Die Zahlung wurde abgebrochen oder abgelehnt …“, Link „Zurück zum Checkout“ führt zum Schritt „Zahlung“.
- [ ] Android Chrome: Google Pay erscheint mit dem neuen `Permissions-Policy`-Header (siehe unten). Falls nicht: Header testweise auf Stripes exakten Wert ohne `*.js.stripe.com` setzen.
- [ ] Browser-Konsole in der Kasse ohne Fehler.

### Lokaler Test 27.11.2026 (headless Chrome, localhost, dev-Datenbank, Stripe-Sandbox, ohne Zahlung)

- Adresse → Versand → Zahlung → Übersicht durchgeklickt; kein Klick auf „Zahlungspflichtig bestellen“ mit Karte (CLAUDE.md: vor der Zahlung stoppen).
- `Permissions-Policy` kommt auf `/at/checkout`, nicht auf anderen Seiten.
- Payment Element deutsch („Kartennummer“, „Ablaufdatum“, „Sicherheitscode“), Farben und hellgrauer Platzhalter wie geplant. Angezeigt: Karte (mit Link), Klarna, PayPal, EPS.
- Apple Pay fehlt lokal, Stripe.js meldet „You have not registered or verified the domain … apple_pay“ (erwartet auf localhost; bestätigt, dass Apple Pay in der Sandbox aktiv ist und nur die Domain fehlt). Google Pay erscheint im headless Chrome ohne Wallet nicht (erwartet).
- „Weiter zur Übersicht“ öffnet kein Fenster; in der Übersicht steht „Kreditkarte“, der Knopf „Zahlungspflichtig bestellen“, AGB/Widerruf/Datenschutz und der Gesamtbetrag inkl. MwSt.
- Übersicht neu geladen (Stripe-Felder leer) und doppelt auf „Zahlungspflichtig bestellen“ geklickt: zurück zum Schritt „Zahlung“, keine Zahlungsbestätigung an Stripe (per Netzwerksperre geprüft). Die Hinweismeldung des Knopfs verschwindet dabei mit dem Schritt (wie vorher).
- `/at/complete-payment?…&redirect_status=failed`: deutsche Meldung, „Zurück zum Checkout“ → `/at/checkout?step=payment`.
- Konsole: keine Fehler; nur Stripe-Hinweise (HTTP, Domain, Klarna/PayPal nicht aktiviert) und zwei bestehende Next.js-Hinweise.
- `pnpm build` (Storefront) und `medusa build` (Backend) erfolgreich; `tsc --noEmit` vorher und nachher je 29 Fehler (alle vorbestehend).
- Nicht getestet (braucht Zahlung oder Gerät): abgelehnte Karte, 3-D-Secure, Wallet-Fenster und dessen Abbruch, Klarna/PayPal-Abbruch beim Anbieter, Webhook nach geschlossenem Browser.

## c) Textentwürfe (zur Prüfung, keine Rechtsberatung)

**Entwurf** – FAQ „Welche Zahlungsmethoden akzeptieren Sie?“ (ersetzt den Satz „Andere Zahlungsarten werden derzeit nicht angeboten.“):

> Sie können bequem per Kreditkarte (Visa, Mastercard), über PayPal und Klarna bezahlen sowie mit Apple Pay und Google Pay auf unterstützten Geräten.

**Entwurf** – Zeile für die Zahlungsarten (Versandseite, Fußzeile): „Apple Pay und Google Pay (auf unterstützten Geräten)“. Für Symbole gelten die Markenrichtlinien von Apple und Google; die offiziellen Marken-SVGs wären neu nach `public/images/payment/` zu legen und in `PAYMENT_METHODS` (`src/lib/util/shop-facts.ts`) einzutragen.

**Entwurf** – neuer Absatz in der Datenschutzerklärung, Abschnitt 4 (die Erklärung nennt Stripe bisher nicht):

> **Zahlungsabwicklung über Stripe.** Für Zahlungen per Kreditkarte, Apple Pay, Google Pay, PayPal und Klarna nutzen wir den Zahlungsdienstleister Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland („Stripe“). Bereits beim Aufruf der Kasse lädt Ihr Browser die für die Zahlung technisch notwendigen Programmteile von Stripe; dabei werden Ihre IP-Adresse und Angaben zu Ihrem Browser und Gerät an Stripe übermittelt. Bei der Zahlung verarbeitet Stripe Ihre Zahlungsdaten (z. B. Kartennummer bzw. ein Token Ihres Wallets, Name, E-Mail-Adresse, Rechnungsadresse und den Betrag). Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Stripe verarbeitet diese Daten in unserem Auftrag und zusätzlich als eigener Verantwortlicher, soweit das zur Betrugsvermeidung und zur Erfüllung gesetzlicher Pflichten (z. B. Geldwäscheprävention) erforderlich ist; dafür gilt die Datenschutzerklärung von Stripe unter https://stripe.com/at/privacy. Stripe kann Daten an Unternehmen der Stripe-Gruppe in den USA übermitteln. Diese Übermittlung stützt sich auf den Angemessenheitsbeschluss der EU-Kommission zum EU-US Data Privacy Framework, unter dem Stripe zertifiziert ist, sowie ergänzend auf Standardvertragsklauseln der EU-Kommission.
>
> **Apple Pay und Google Pay.** Wenn Sie mit Apple Pay oder Google Pay bezahlen, verarbeiten Apple (Apple Distribution International Ltd., Irland) bzw. Google (Google Ireland Limited, Irland) die in Ihrem Wallet hinterlegten Daten nach ihren eigenen Bedingungen und Datenschutzhinweisen. Wir erhalten von Apple oder Google keine vollständigen Kartendaten, sondern nur das von Stripe verarbeitete Zahlungsergebnis.

Vor Veröffentlichung prüfen: Stripe-Gesellschaft laut eurem Stripe-Vertrag, DPF-Zertifizierung von Stripe (dataprivacyframework.gov), ob PayPal/Klarna über Stripe oder direkt abgerechnet werden, und ob die Cookie-Einstellungen Stripe als „unbedingt erforderlich“ nennen.

## Schritt 4 – Anzeige der Zahlungsart (nur Vorschlag, nicht umgesetzt)

Ist-Zustand:

- Bestellbestätigung im Shop (`src/modules/order/components/payment-details/index.tsx`): zeigt für **jede** Stripe-Zahlung „Kreditkarte“, auch für PayPal und Klarna, weil `paymentInfoMap` nach `provider_id` (`pp_stripe_stripe`) sucht. Der Zweig „Karte: **** 1234“ greift nie, Medusa speichert kein `card_last4`.
- Kunden-Mails und Rechnung (§ 11 UStG, `invoice_generator`): keine Zahlungsart.
- Admin-Mail: bewusst keine Zeile (Kommentar im Template). Medusa-Admin: zeigt nur „Stripe“.
- Medusa speichert am Payment den PaymentIntent (`payment.data`), ohne erweiterte Charge. Die Wallet steht nur in `charge.payment_method_details.card.wallet.type` (`apple_pay`, `google_pay`), die Art in `payment_method_details.type` (`card`, `paypal`, `klarna`).

Optionen:

- **A (Empfehlung, ca. 1–2 h):** Backend-Subscriber auf `order.placed`. Er holt `paymentIntents.retrieve(id, { expand: ["latest_charge"] })` mit dem vorhandenen `STRIPE_API_KEY` und schreibt `order.metadata.payment_method_label` („Apple Pay“, „Google Pay“, „Kreditkarte (Visa •••• 4242)“, „PayPal“, „Klarna“). Bestellseite, Admin-Mail und Rechnung lesen dieses Feld; fehlt es, steht wie bisher nichts bzw. „Stripe“. Belastbar, weil die Angabe von Stripe kommt.
- **B (ca. 30 min):** Die im Payment Element gewählte Art vor `confirmPayment` in `cart.metadata` speichern und in die Bestellung übernehmen. Billig, aber vom Browser behauptet und nach Abbruch/Wechsel ungenau.
- **C:** Nur die falsche Anzeige „Kreditkarte“ auf der Bestellseite durch „Online bezahlt (Stripe)“ ersetzen. Minimal, aber ohne echte Information.

## d) Änderungen, Datei für Datei

- `backend/medusa-config.js`: Provider-Option `automaticPaymentMethods: true` (setzt `automatic_payment_methods: { enabled: true }` am PaymentIntent; in `@medusajs/payment-stripe` 2.12.3 geprüft). Warnung beim Start, wenn `STRIPE_API_KEY` gesetzt ist, `STRIPE_WEBHOOK_SECRET` aber fehlt. `capture: true`, API-Version (Stripe-SDK 15.12 → `2024-04-10`) und das bedingte Laden bleiben unverändert. Kein `payment_method_types`.
- `storefront/src/modules/checkout/components/payment/index.tsx`: „Weiter zur Übersicht“ ohne `elements.submit()`.
- `storefront/src/modules/checkout/components/payment-button/index.tsx`: `submit()` als erster Aufruf im Klick, Meta-Zuordnung parallel, Wallet-Abbruch mit eigener Meldung ohne Rücksprung, deutsche Ersatztexte für technische Stripe-Fehler, Sperre gegen Doppelklick (`useRef`), gewählte Art über das `change`-Ereignis.
- `storefront/src/lib/constants.tsx`: `paymentInfoMap`-Einträge für `card`, `apple_pay`, `google_pay`, `klarna`, `paypal`, `link`; Helfer `isWalletPaymentType`.
- `storefront/src/modules/checkout/components/payment-wrapper/stripe-wrapper.tsx`: `locale: "de"`, `appearance` aus der „stone“-Palette (Platzhalter bleibt hellgrau).
- `storefront/src/app/[countryCode]/complete-payment/page.tsx`: wertet `redirect_status=failed` aus (kein Abschlussversuch, deutsche Meldung), Medusa-Fehler nur noch im Log, Ersatzland `at` statt `de`, „Zurück zum Checkout“ führt zum Schritt „Zahlung“.
- `storefront/next.config.js`: `Permissions-Policy: payment=(self "https://js.stripe.com" "https://*.js.stripe.com" "https://checkout.stripe.com")` nur auf `/:countryCode/checkout`. Eine CSP gibt es nicht; falls später eine kommt, braucht Stripe.js `script-src` und `frame-src` für `https://js.stripe.com` und `https://*.js.stripe.com`, `frame-src https://hooks.stripe.com` und `connect-src https://api.stripe.com`.

Stripe.js lädt weiter nur in der Kasse (`loadStripe` in `payment-wrapper/index.tsx`, nur von der Checkout-Seite importiert) und immer von `js.stripe.com`.

### Nicht geprüft

- Stripe-Dashboard (aktive Zahlungsarten, Domains, Webhooks) und Railway-Variablen: kein Zugriff aus dieser Sitzung.
- Wallet-Verhalten am Gerät (öffnet bei `submit()`, Fehler beim Abbrechen, `event.value.type`), siehe Testplan.
- Ob der `*.js.stripe.com`-Eintrag im `Permissions-Policy`-Header nötig oder schädlich ist: Stripes Beispiel nennt nur `https://js.stripe.com` und `https://checkout.stripe.com`.
- `src/app/api/capture-payment/[cartId]/route.ts` wird nicht verwendet (Rücksprung geht auf `/complete-payment`); unverändert gelassen. Ebenso der tote `CardElement`-Code in `payment-container/`.
