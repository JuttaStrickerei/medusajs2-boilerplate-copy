import { Text, Section, Container } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

export const CONTACT_FORM_CONFIRMATION = 'contact-form-confirmation'

interface ContactFormConfirmationPreviewProps {
  firstName: string
  subject: string
}

export interface ContactFormConfirmationTemplateProps {
  firstName: string
  subject: string
  preview?: string
}

export const isContactFormConfirmationTemplateData = (data: any): data is ContactFormConfirmationTemplateProps =>
  typeof data.firstName === 'string' &&
  typeof data.subject === 'string'

export const ContactFormConfirmationTemplate: React.FC<ContactFormConfirmationTemplateProps> & {
  PreviewProps: ContactFormConfirmationPreviewProps
} = ({ firstName, subject, preview = 'Vielen Dank für Ihre Nachricht' }) => {
  return (
    <Base preview={preview}>
      <Section>
        <Container style={{ maxWidth: '600px' }}>
          {/* Header */}
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '30px' }}>
            <tr>
              <td align="center" style={{ paddingBottom: '24px', borderBottom: '1px solid #e7e5e4' }}>
                <Text style={{ 
                  fontSize: '30px', 
                  fontWeight: '500', 
                  color: '#1c1917',
                  margin: '0 0 8px 0',
                  fontFamily: 'Georgia, serif'
                }}>
                  Vielen Dank für Ihre Nachricht!
                </Text>
              </td>
            </tr>
          </table>

          {/* Content */}
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ 
            marginBottom: '24px'
          }}>
            <tr>
              <td>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#57534e',
                  margin: '0',
                  lineHeight: '22px'
                }}>
                  Liebe/r {firstName},
                </Text>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#57534e',
                  margin: '8px 0 0 0',
                  lineHeight: '22px'
                }}>
                  wir haben Ihre Anfrage zum Thema <strong style={{ color: '#1c1917' }}>"{subject}"</strong> erhalten und werden uns so schnell wie möglich bei Ihnen melden.
                </Text>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#57534e',
                  margin: '8px 0 0 0',
                  lineHeight: '22px'
                }}>
                  In der Regel erhalten Sie innerhalb von 1-2 Werktagen eine Antwort von uns.
                </Text>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#57534e',
                  margin: '16px 0 0 0',
                  lineHeight: '22px'
                }}>
                  Mit freundlichen Grüßen,<br />
                  <strong style={{ color: '#1c1917' }}>Ihr Team von Strickerei Jutta</strong>
                </Text>
              </td>
            </tr>
          </table>

          {/* Footer Info */}
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ 
            paddingTop: '24px',
            borderTop: '1px solid #e7e5e4',
            marginTop: '24px'
          }}>
            <tr>
              <td>
                <Text style={{ 
                  fontSize: '13px',
                  color: '#57534e',
                  margin: '0 0 8px 0',
                  lineHeight: '20px'
                }}>
                  <strong style={{ color: '#1c1917' }}>Kontaktinformationen:</strong>
                </Text>
                <Text style={{ 
                  fontSize: '13px',
                  color: '#57534e',
                  margin: '0 0 4px 0',
                  lineHeight: '20px'
                }}>
                  Strickerei Jutta<br />
                  Wiener Neustädterstraße 47<br />
                  7021 Draßburg<br />
                  Österreich
                </Text>
                <Text style={{ 
                  fontSize: '13px',
                  color: '#57534e',
                  margin: '8px 0 0 0',
                  lineHeight: '20px'
                }}>
                  Telefon: +43 2686 2259<br />
                  E-Mail: <a href="mailto:office@strickerei-jutta.at" style={{ color: '#1c1917', textDecoration: 'underline' }}>office@strickerei-jutta.at</a>
                </Text>
              </td>
            </tr>
          </table>
        </Container>
      </Section>
    </Base>
  )
}

ContactFormConfirmationTemplate.PreviewProps = {
  firstName: 'Max',
  subject: 'Produktanfrage'
} as ContactFormConfirmationPreviewProps

export default ContactFormConfirmationTemplate

