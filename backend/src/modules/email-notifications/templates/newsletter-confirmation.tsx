import { Html, Body, Preview, Img } from '@react-email/components'
import * as React from 'react'

export const NEWSLETTER_CONFIRMATION = 'newsletter-confirmation'

interface NewsletterConfirmationPreviewProps {
  firstName?: string
  email: string
}

export interface NewsletterConfirmationProduct {
  title: string
  /** Absolute Adresse der Produktseite */
  url: string
  /** Absolute Bildadresse (Produkt-Thumbnail) */
  image: string
}

export interface NewsletterConfirmationTemplateProps {
  firstName?: string
  email: string
  preview?: string
  /** Persönlicher Willkommens-Code (workflows/create-welcome-promotion). Ohne Code kein Gutschein-Block. */
  discountCode?: string
  discountPercent?: number
  /** Ausgeschriebenes Datum, z. B. „15. Dezember 2026“ */
  discountValidUntil?: string
  /** Bis zu drei Stücke (Bild, Name, Link, ohne Preise). Ohne Produkte kein Abschnitt. */
  products?: NewsletterConfirmationProduct[]
  /** Bis zu zwei Looks (Foto vom Shooting, Name, Link). Ohne Looks nur die Stücke. */
  looks?: NewsletterConfirmationProduct[]
  /** Adresse des Shops (STOREFRONT_URL aus lib/constants). Ohne Angabe der Live-Shop. */
  shopUrl?: string
}

export const isNewsletterConfirmationTemplateData = (data: any): data is NewsletterConfirmationTemplateProps =>
  typeof data.email === 'string' &&
  (data.firstName === undefined || typeof data.firstName === 'string')

const DEFAULT_SHOP_URL = 'https://shop.strickerei-jutta.at'

// Markenfarben und Schriften wie im Shop-Kopf und in den Marketing-Unterlagen
// (Playfair Display + Roboto, Tint #F1F4FD, Ink #161619)
const INK = '#161619'
const INK_SOFT = '#3d3d43'
const INK_MUTE = '#6e6e78'
const RULE = '#d8dce9'
const RULE_SOFT = '#e8ebf5'
const TINT = '#f1f4fd'
const PAPER = '#ffffff'
const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif"
const SANS = 'Roboto, Arial, Helvetica, sans-serif'

// Eigener Kopf statt base.tsx (dessen Rahmen ist 465 px breit). Als Text, weil sich die
// Outlook-Kommentare nicht als JSX schreiben lassen: Outlook am PC kennt weder Webschriften
// noch max-width und bekommt hier Georgia/Arial und die feste Breite von 600 px.
// Die Maße im Dokument gelten fürs Handy, ab 600 px Breite gelten die größeren hier.
const HEAD = `
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Willkommen bei Strickerei Jutta</title>
<!--[if mso]>
<style>
  .jw-serif { font-family: Georgia, 'Times New Roman', serif !important; }
  .jw-sans { font-family: Arial, Helvetica, sans-serif !important; }
  .jw-card { width: 600px !important; }
</style>
<![endif]-->
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&amp;family=Roboto:wght@400;500&amp;display=swap" rel="stylesheet">
<!--<![endif]-->
<style>
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  @media screen and (min-width: 600px) {
    .jw-outer { padding: 32px 16px !important; }
    .jw-top { border-radius: 16px 16px 0 0 !important; }
    .jw-bottom { border-radius: 0 0 16px 16px !important; }
    .jw-px { padding-left: 48px !important; padding-right: 48px !important; }
    .jw-logo { width: 150px !important; }
    .jw-look { padding-left: 8px !important; padding-right: 8px !important; }
    .jw-h1 { font-size: 36px !important; line-height: 44px !important; }
    .jw-h2 { font-size: 28px !important; line-height: 36px !important; }
    .jw-voucher { padding: 36px 40px 32px 40px !important; }
    .jw-code { font-size: 26px !important; line-height: 34px !important; letter-spacing: 2px !important; padding: 16px 20px !important; }
    .jw-kicker { font-size: 12px !important; letter-spacing: 3px !important; }
    .jw-piece { padding-left: 8px !important; padding-right: 8px !important; }
    .jw-piece-name { font-size: 16px !important; line-height: 22px !important; }
    .jw-note { font-size: 20px !important; line-height: 30px !important; }
  }
</style>
`

const tableProps = {
  role: 'presentation',
  width: '100%',
  cellPadding: 0,
  cellSpacing: 0,
  border: 0,
} as const

const kicker: React.CSSProperties = {
  margin: '0',
  fontFamily: SANS,
  fontSize: '11px',
  lineHeight: '18px',
  letterSpacing: '2.2px',
  textTransform: 'uppercase',
  color: INK_MUTE,
}

const paragraph: React.CSSProperties = {
  margin: '0',
  fontFamily: SANS,
  fontSize: '16px',
  lineHeight: '26px',
  color: INK_SOFT,
  textWrap: 'balance',
}

// Überschriften in Playfair: Ziffern in Versalhöhe („10 %“ statt „1o %“), Zeilen gleich lang umbrochen
const heading: React.CSSProperties = {
  fontFamily: SERIF,
  fontWeight: 400,
  color: INK,
  fontVariantNumeric: 'lining-nums',
  textWrap: 'balance',
}

const small: React.CSSProperties = {
  margin: '0',
  fontFamily: SANS,
  fontSize: '14px',
  lineHeight: '22px',
  color: INK_SOFT,
  textWrap: 'balance',
}

export const NewsletterConfirmationTemplate: React.FC<NewsletterConfirmationTemplateProps> & {
  PreviewProps: NewsletterConfirmationPreviewProps
} = ({
  firstName,
  email,
  preview = 'Willkommen bei Strickerei Jutta!',
  discountCode,
  discountPercent,
  discountValidUntil,
  products,
  looks,
  shopUrl = DEFAULT_SHOP_URL,
}) => {
  const SHOP_URL = `${shopUrl.replace(/\/+$/, '')}/`
  // Logo als PNG (WebP zeigt Outlook nicht): storefront/public/images/logo/logo-jutta-mail.png
  const LOGO_URL = `${SHOP_URL}images/logo/logo-jutta-mail.png`
  // Mit Gutscheincode tragen alle Links in den Shop den Code mit (?gutschein=…). Der
  // Shop merkt ihn sich und löst ihn im Warenkorb von selbst ein (storefront: voucher-link).
  // Dazu die Kennung der Mail, damit Analytics den Besuch „newsletter / email“
  // zuordnet statt „Direct“ (welche Stelle der Mail: utm_content).
  const withVoucher = (url: string, place: string) => {
    const params = new URLSearchParams({
      ...(discountCode ? { gutschein: discountCode } : {}),
      utm_source: 'newsletter',
      utm_medium: 'email',
      utm_campaign: 'willkommen',
      utm_content: place,
    })
    return `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`
  }

  const pieces = (Array.isArray(products) ? products : [])
    .filter((piece) => piece && piece.title && piece.url && piece.image)
    .slice(0, 3)
  const lookPhotos = (Array.isArray(looks) ? looks : [])
    .filter((look) => look && look.title && look.url && look.image)
    .slice(0, 2)
  // Drei Stücke nebeneinander, bei ein oder zwei Stücken größere Bilder
  const pieceImageWidth = pieces.length >= 3 ? 152 : 240

  // Begrüßungstext. Mit Gutscheincode steht er unter dem Code: Wer sich für den Code
  // angemeldet hat, soll ihn am Handy sofort sehen.
  const introText = (
    <>
      <p className="jw-sans" style={{ ...paragraph, margin: discountCode ? '0' : '20px 0 0 0' }}>
        Vielen Dank für Ihre Anmeldung zu unserem Newsletter. Wir sind ein Familienbetrieb
        in dritter Generation und stricken in Draßburg im Burgenland.
      </p>
      <p className="jw-sans" style={{ ...paragraph, margin: '14px 0 0 0' }}>
        Von uns hören Sie, wenn eine neue Kollektion fertig ist. Dazu kommen Pflegetipps
        für Ihre Strickstücke, Einblicke in unsere Strickerei und hin und wieder ein Angebot,
        das es nur im Newsletter gibt.
      </p>
    </>
  )

  return (
    <Html lang="de">
      <head dangerouslySetInnerHTML={{ __html: HEAD }} />
      <Body style={{ margin: '0', padding: '0', width: '100%', backgroundColor: TINT }}>
        <Preview>{preview}</Preview>
        <table {...tableProps} style={{ backgroundColor: TINT }}>
          <tbody>
            <tr>
              <td align="center" className="jw-outer" style={{ padding: '0' }}>
                <table
                  {...tableProps}
                  align="center"
                  className="jw-card"
                  style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}
                >
                  <tbody>
                    {/* Kopf: Wortmarke wie im Shop */}
                    <tr>
                      <td
                        align="center"
                        className="jw-top"
                        style={{ backgroundColor: PAPER, padding: '20px 20px 16px 20px', borderBottom: `1px solid ${RULE_SOFT}` }}
                      >
                        <a href={withVoucher(`${SHOP_URL}at`, 'logo')} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: INK }}>
                          <Img
                            src={LOGO_URL}
                            alt="Jutta Strickerei"
                            width={132}
                            className="jw-logo"
                            style={{
                              display: 'block',
                              width: '132px',
                              height: 'auto',
                              margin: '0 auto',
                              // sichtbar, wenn Bilder nicht geladen werden
                              fontFamily: SERIF,
                              fontSize: '26px',
                              lineHeight: '34px',
                              color: INK,
                            }}
                          />
                        </a>
                      </td>
                    </tr>

                    {/* Begrüßung */}
                    <tr>
                      <td align="center" className="jw-px" style={{ backgroundColor: PAPER, padding: '36px 20px 0 20px' }}>
                        <p className="jw-sans jw-kicker" style={kicker}>Willkommen</p>
                        <h1
                          className="jw-serif jw-h1"
                          style={{ ...heading, margin: '12px 0 0 0', fontSize: '30px', lineHeight: '38px' }}
                        >
                          {firstName ? `Schön, dass Sie da sind, ${firstName}.` : 'Schön, dass Sie da sind.'}
                        </h1>
                        {!discountCode && introText}
                      </td>
                    </tr>

                    {/* Persönlicher Gutscheincode */}
                    {discountCode && (
                      <tr>
                        <td className="jw-px" style={{ backgroundColor: PAPER, padding: '32px 20px 0 20px' }}>
                          <table {...tableProps}>
                            <tbody>
                              <tr>
                                <td
                                  align="center"
                                  className="jw-voucher"
                                  style={{ backgroundColor: TINT, border: `1px solid ${RULE}`, borderRadius: '16px', padding: '28px 16px 24px 16px' }}
                                >
                                  <p className="jw-sans jw-kicker" style={{ ...kicker, color: INK_SOFT }}>Ihr persönlicher Gutscheincode</p>
                                  <h2
                                    className="jw-serif jw-h2"
                                    style={{ ...heading, margin: '10px 0 0 0', fontSize: '24px', lineHeight: '32px' }}
                                  >
                                    {discountPercent ? `${discountPercent}\u00a0% auf Ihre erste Bestellung` : 'Für Ihre erste Bestellung'}
                                  </h2>
                                  <table {...tableProps} style={{ margin: '20px 0 0 0' }}>
                                    <tbody>
                                      <tr>
                                        <td
                                          align="center"
                                          className="jw-sans jw-code"
                                          style={{
                                            backgroundColor: PAPER,
                                            border: `1px solid ${INK}`,
                                            borderRadius: '10px',
                                            padding: '14px 8px',
                                            fontFamily: SANS,
                                            fontSize: '20px',
                                            lineHeight: '28px',
                                            fontWeight: 500,
                                            letterSpacing: '1px',
                                            color: INK,
                                            // ein Tippen markiert den ganzen Code
                                            userSelect: 'all',
                                            WebkitUserSelect: 'all',
                                          }}
                                        >
                                          {discountCode}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  <p className="jw-sans" style={{ ...small, margin: '18px 0 0 0' }}>
                                    Gültig{discountValidUntil ? ` bis ${discountValidUntil}` : ''} für eine Bestellung.
                                    Nicht mit anderen Gutscheincodes kombinierbar.
                                  </p>
                                  <p className="jw-sans" style={{ ...small, margin: '8px 0 0 0' }}>
                                    So lösen Sie ihn ein: Tippen Sie auf „Gutschein einlösen“, dann
                                    ziehen wir ihn im Warenkorb von selbst ab. Oder geben Sie den Code
                                    dort unter „Gutscheincode hinzufügen“ ein.
                                  </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}

                    {/* Ein Knopf zum Shop */}
                    <tr>
                      <td align="center" className="jw-px" style={{ backgroundColor: PAPER, padding: '28px 20px 40px 20px' }}>
                        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center" style={{ margin: '0 auto' }}>
                          <tbody>
                            <tr>
                              <td
                                align="center"
                                style={{ backgroundColor: INK, borderRadius: '8px', msoPaddingAlt: '15px 36px' } as React.CSSProperties}
                              >
                                <a
                                  href={withVoucher(`${SHOP_URL}at`, 'knopf')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="jw-sans"
                                  style={{
                                    display: 'inline-block',
                                    padding: '15px 36px',
                                    backgroundColor: INK,
                                    borderRadius: '8px',
                                    fontFamily: SANS,
                                    fontSize: '16px',
                                    lineHeight: '20px',
                                    fontWeight: 500,
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                  }}
                                >
                                  {discountCode ? 'Gutschein einlösen' : 'Zum Onlineshop'}
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {discountCode && (
                      <tr>
                        <td align="center" className="jw-px" style={{ backgroundColor: PAPER, padding: '0 20px 40px 20px' }}>
                          {introText}
                        </td>
                      </tr>
                    )}

                    {/* Looks vom Shooting und bis zu drei Stücke, ohne Preise */}
                    {(lookPhotos.length > 0 || pieces.length > 0) && (
                      <tr>
                        <td align="center" className="jw-px" style={{ backgroundColor: PAPER, padding: '0 20px 40px 20px' }}>
                          <table {...tableProps}>
                            <tbody>
                              <tr>
                                <td align="center" style={{ borderTop: `1px solid ${RULE_SOFT}`, padding: '36px 0 24px 0' }}>
                                  <p className="jw-sans jw-kicker" style={kicker}>Aus der Kollektion</p>
                                  <h2
                                    className="jw-serif jw-h2"
                                    style={{ ...heading, margin: '10px 0 0 0', fontSize: '24px', lineHeight: '32px' }}
                                  >
                                    {lookPhotos.length > 0 ? 'Looks und Stücke zum Kennenlernen' : 'Stücke zum Kennenlernen'}
                                  </h2>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          {lookPhotos.length > 0 && (
                            <table {...tableProps} style={{ margin: pieces.length > 0 ? '0 0 28px 0' : '0' }}>
                              <tbody>
                                <tr>
                                  {lookPhotos.map((look) => (
                                    <td
                                      key={look.url}
                                      align="center"
                                      valign="top"
                                      width={`${Math.floor(100 / lookPhotos.length)}%`}
                                      className="jw-look"
                                      style={{ padding: '0 4px' }}
                                    >
                                      <a href={withVoucher(look.url, 'look')} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: INK }}>
                                        <Img
                                          src={look.image}
                                          alt={look.title}
                                          width={lookPhotos.length >= 2 ? 244 : 400}
                                          style={{
                                            display: 'block',
                                            width: '100%',
                                            maxWidth: lookPhotos.length >= 2 ? '244px' : '400px',
                                            height: 'auto',
                                            margin: '0 auto',
                                            borderRadius: '8px',
                                            fontFamily: SANS,
                                            fontSize: '13px',
                                            lineHeight: '18px',
                                            color: INK_SOFT,
                                          }}
                                        />
                                        <span
                                          className="jw-serif jw-piece-name"
                                          style={{ display: 'block', margin: '12px 0 0 0', fontFamily: SERIF, fontSize: '15px', lineHeight: '20px', color: INK }}
                                        >
                                          {look.title}
                                        </span>
                                        <span
                                          className="jw-sans"
                                          style={{ display: 'block', margin: '4px 0 0 0', fontFamily: SANS, fontSize: '13px', lineHeight: '20px', color: INK_SOFT, textDecoration: 'underline' }}
                                        >
                                          Look ansehen
                                        </span>
                                      </a>
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          )}
                          {pieces.length > 0 && (
                          <table {...tableProps}>
                            <tbody>
                              <tr>
                                {pieces.map((piece) => (
                                  <td
                                    key={piece.url}
                                    align="center"
                                    valign="top"
                                    width={`${Math.floor(100 / pieces.length)}%`}
                                    className="jw-piece"
                                    style={{ padding: '0 3px' }}
                                  >
                                    <a href={withVoucher(piece.url, 'stueck')} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: INK }}>
                                      <Img
                                        src={piece.image}
                                        alt={piece.title}
                                        width={pieceImageWidth}
                                        style={{
                                          display: 'block',
                                          width: '100%',
                                          maxWidth: `${pieceImageWidth}px`,
                                          height: 'auto',
                                          margin: '0 auto',
                                          boxSizing: 'border-box',
                                          border: `1px solid ${RULE_SOFT}`,
                                          borderRadius: '8px',
                                          // sichtbar, wenn Bilder nicht geladen werden
                                          fontFamily: SANS,
                                          fontSize: '13px',
                                          lineHeight: '18px',
                                          color: INK_SOFT,
                                        }}
                                      />
                                      <span
                                        className="jw-serif jw-piece-name"
                                        style={{ display: 'block', margin: '12px 0 0 0', fontFamily: SERIF, fontSize: '14px', lineHeight: '20px', color: INK }}
                                      >
                                        {piece.title}
                                      </span>
                                      <span
                                        className="jw-sans"
                                        style={{ display: 'block', margin: '4px 0 0 0', fontFamily: SANS, fontSize: '13px', lineHeight: '20px', color: INK_SOFT, textDecoration: 'underline' }}
                                      >
                                        Ansehen
                                      </span>
                                    </a>
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                          )}
                        </td>
                      </tr>
                    )}

                    {/* Handwerk und Lieferzeit, Gruß */}
                    <tr>
                      <td align="center" className="jw-px" style={{ backgroundColor: PAPER, padding: '0 20px 40px 20px' }}>
                        <table {...tableProps}>
                          <tbody>
                            <tr>
                              <td align="center" style={{ borderTop: `1px solid ${RULE_SOFT}`, padding: '36px 0 0 0' }}>
                                <p
                                  className="jw-serif jw-note"
                                  style={{ ...heading, margin: '0', fontSize: '18px', lineHeight: '28px', fontStyle: 'italic' }}
                                >
                                  Viele unserer Stücke stricken wir erst, wenn Sie bestellen.
                                  2{'\u00a0'}Wochen nach Ihrer Bestellung ist Ihr Stück bei Ihnen.
                                </p>
                                <p className="jw-sans" style={{ ...paragraph, margin: '24px 0 0 0' }}>
                                  Herzliche Grüße
                                  <br />
                                  Ihre Strickerei Jutta
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Fußzeile */}
                    <tr>
                      <td align="center" className="jw-px jw-bottom" style={{ backgroundColor: INK, padding: '36px 20px 32px 20px' }}>
                        <p
                          className="jw-serif"
                          style={{ margin: '0', fontFamily: SERIF, fontSize: '20px', lineHeight: '28px', fontWeight: 500, color: '#ffffff' }}
                        >
                          Strickerei Jutta
                        </p>
                        <p className="jw-sans" style={{ ...small, margin: '10px 0 0 0', color: '#d3d6e0' }}>
                          Wiener Neustädterstraße 47
                          <br />
                          7021 Draßburg im Burgenland
                        </p>
                        <p className="jw-sans" style={{ ...small, margin: '10px 0 0 0', color: '#d3d6e0' }}>
                          <a href="tel:+4326862259" style={{ color: '#ffffff', textDecoration: 'underline' }}>
                            +43 2686 2259
                          </a>
                          {' · '}
                          <a href="mailto:office@strickerei-jutta.at" style={{ color: '#ffffff', textDecoration: 'underline' }}>
                            office@strickerei-jutta.at
                          </a>
                        </p>
                        <p
                          className="jw-sans"
                          style={{ margin: '24px 0 0 0', padding: '20px 0 0 0', borderTop: '1px solid #3d3d43', fontFamily: SANS, fontSize: '12px', lineHeight: '18px', color: '#a9adba' }}
                        >
                          Sie erhalten diese E-Mail, weil Sie sich für unseren Newsletter angemeldet haben.
                          <br />
                          {/* Die frühere Adresse strickerei-jutta.at/unsubscribe gibt es nicht (404).
                              Bis ein Abmeldelink aus Mailchimp vorliegt, geht die Abmeldung per E-Mail. */}
                          <a
                            href="mailto:office@strickerei-jutta.at?subject=Newsletter%20abbestellen"
                            style={{ color: '#a9adba', textDecoration: 'underline' }}
                          >
                            Newsletter abbestellen
                          </a>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  )
}

NewsletterConfirmationTemplate.PreviewProps = {
  firstName: 'Max',
  email: 'max.mustermann@example.com'
} as NewsletterConfirmationPreviewProps

export default NewsletterConfirmationTemplate
