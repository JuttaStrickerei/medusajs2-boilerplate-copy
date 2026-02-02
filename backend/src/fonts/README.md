# Georgia Font für PDF-Rechnungen

Dieses Verzeichnis enthält die Base64-kodierten Georgia-Font-Dateien für die PDF-Rechnungsgenerierung.

## Setup

1. **Font-Dateien konvertieren:**
   - Lade die Georgia-Font-Dateien (.ttf) von deinem System oder aus dem Internet
   - Konvertiere sie zu Base64-Strings mit einem Tool wie:
     - https://www.base64encode.org/
     - Oder einem Node.js-Script

2. **Base64-Strings einfügen:**
   - Öffne `georgia-base64.ts`
   - Ersetze die leeren Strings mit deinen Base64-kodierten Font-Daten:
     ```typescript
     export const georgiaNormal = "dein-base64-string-hier..." // Georgia Regular
     export const georgiaBold = "dein-base64-string-hier..." // Georgia Bold
     ```

3. **Optionale Fonts:**
   - `georgiaItalic` - Falls vorhanden, sonst wird `georgiaNormal` verwendet
   - `georgiaBoldItalic` - Falls vorhanden, sonst wird `georgiaBold` verwendet

## Verwendung

Die Fonts werden automatisch in `invoice_generator/service.ts` importiert und verwendet, sobald die Base64-Strings eingefügt sind.

Die Rechnung verwendet Georgia-Font für:
- Firmenname
- Rechnungstitel
- Abschnittsüberschriften
- Adressüberschriften
- Anmerkungsüberschriften
- "Vielen Dank"-Text

Falls die Base64-Strings leer sind, wird automatisch Helvetica als Fallback verwendet.
