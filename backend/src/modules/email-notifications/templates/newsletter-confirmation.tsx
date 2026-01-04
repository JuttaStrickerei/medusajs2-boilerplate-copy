import { Text, Section, Container, Link } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

export const NEWSLETTER_CONFIRMATION = 'newsletter-confirmation'

interface NewsletterConfirmationPreviewProps {
  firstName?: string
  email: string
}

export interface NewsletterConfirmationTemplateProps {
  firstName?: string
  email: string
  preview?: string
}

export const isNewsletterConfirmationTemplateData = (data: any): data is NewsletterConfirmationTemplateProps =>
  typeof data.email === 'string' &&
  (data.firstName === undefined || typeof data.firstName === 'string')

export const NewsletterConfirmationTemplate: React.FC<NewsletterConfirmationTemplateProps> & {
  PreviewProps: NewsletterConfirmationPreviewProps
} = ({ firstName, email, preview = 'Willkommen bei Strickerei Jutta!' }) => {
  return (
    <Base preview={preview}>
      <Section>
        <Container style={{ maxWidth: '600px' }}>
          {/* Header */}
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '30px' }}>
            <tr>
              <td align="center" style={{ 
                backgroundColor: '#1c1917', 
                padding: '20px',
                borderRadius: '8px 8px 0 0'
              }}>
                <Text style={{ 
                  fontSize: '28px', 
                  fontWeight: 'normal', 
                  color: '#ffffff',
                  margin: '0',
                  fontFamily: 'Georgia, serif'
                }}>
                  Strickerei Jutta
                </Text>
              </td>
            </tr>
          </table>

          {/* Content */}
          <table width="100%" cellPadding="40" cellSpacing="0" style={{ 
            backgroundColor: '#ffffff',
            marginBottom: '25px',
            border: '1px solid #e7e5e4',
            borderRadius: '0 0 8px 8px'
          }}>
            <tr>
              <td>
                <Text style={{ 
                  fontSize: '24px',
                  fontWeight: 'normal',
                  color: '#1c1917',
                  margin: '0 0 20px 0',
                  fontFamily: 'Georgia, serif'
                }}>
                  Willkommen in unserem Newsletter!
                </Text>
                
                <Text style={{ 
                  fontSize: '14px',
                  color: '#57534e',
                  margin: '0 0 20px 0',
                  lineHeight: '22px'
                }}>
                  {firstName ? `Liebe/r ${firstName},` : 'Hallo,'}
                </Text>
                
                <Text style={{ 
                  fontSize: '14px',
                  color: '#57534e',
                  margin: '0 0 20px 0',
                  lineHeight: '22px'
                }}>
                  vielen Dank für Ihre Anmeldung zu unserem Newsletter! Ab sofort erhalten Sie:
                </Text>
                
                <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '20px' }}>
                  <tr>
                    <td style={{ paddingBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: '#57534e', margin: '0', lineHeight: '22px' }}>
                        • Exklusive Einblicke in neue Kollektionen
                      </Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: '#57534e', margin: '0', lineHeight: '22px' }}>
                        • Besondere Angebote nur für Newsletter-Abonnenten
                      </Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: '#57534e', margin: '0', lineHeight: '22px' }}>
                        • Pflegetipps für Ihre Strickwaren
                      </Text>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Text style={{ fontSize: '14px', color: '#57534e', margin: '0', lineHeight: '22px' }}>
                        • Geschichten aus unserer Manufaktur
                      </Text>
                    </td>
                  </tr>
                </table>
                
                <Text style={{ 
                  fontSize: '14px',
                  color: '#57534e',
                  margin: '0 0 30px 0',
                  lineHeight: '22px'
                }}>
                  Wir freuen uns, Sie in unserer Community begrüßen zu dürfen!
                </Text>
                
                {/* CTA Button */}
                <table width="100%" cellPadding="0" cellSpacing="0" style={{ margin: '30px 0', textAlign: 'center' }}>
                  <tr>
                    <td>
                      <Link
                        href="https://shop.strickerei-jutta.at/"
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#1c1917',
                          color: '#ffffff',
                          padding: '14px 32px',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '500'
                        }}
                      >
                        Jetzt stöbern
                      </Link>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          {/* Footer */}
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ 
            textAlign: 'center',
            marginTop: '40px'
          }}>
            <tr>
              <td>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#78716c',
                  margin: '0 0 10px 0',
                  lineHeight: '20px'
                }}>
                  Strickerei Jutta<br />
                  Wiener Neustädterstraße 47, 7021 Draßburg
                </Text>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#78716c',
                  margin: '0 0 10px 0',
                  lineHeight: '20px'
                }}>
                  <Link href="tel:+4326862259" style={{ color: '#78716c', textDecoration: 'none' }}>
                    +43 2686 2259
                  </Link>
                  {' · '}
                  <Link href="mailto:office@strickerei-jutta.at" style={{ color: '#78716c', textDecoration: 'none' }}>
                    office@strickerei-jutta.at
                  </Link>
                </Text>
                <Text style={{ 
                  fontSize: '12px',
                  color: '#78716c',
                  margin: '20px 0 0 0',
                  lineHeight: '18px'
                }}>
                  Sie erhalten diese E-Mail, weil Sie sich für unseren Newsletter angemeldet haben.<br />
                  <Link href="https://strickerei-jutta.at/unsubscribe" style={{ color: '#78716c', textDecoration: 'underline' }}>
                    Newsletter abbestellen
                  </Link>
                </Text>
              </td>
            </tr>
          </table>
        </Container>
      </Section>
    </Base>
  )
}

NewsletterConfirmationTemplate.PreviewProps = {
  firstName: 'Max',
  email: 'max.mustermann@example.com'
} as NewsletterConfirmationPreviewProps

export default NewsletterConfirmationTemplate

