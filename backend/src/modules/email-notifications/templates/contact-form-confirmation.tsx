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
              <td align="center" style={{ 
                backgroundColor: '#1c1917', 
                padding: '20px',
                borderRadius: '8px 8px 0 0'
              }}>
                <Text style={{ 
                  fontSize: '26px', 
                  fontWeight: 'bold', 
                  color: '#ffffff',
                  margin: '0'
                }}>
                  Vielen Dank für Ihre Nachricht!
                </Text>
              </td>
            </tr>
          </table>

          {/* Content */}
          <table width="100%" cellPadding="20" cellSpacing="0" style={{ 
            backgroundColor: '#ffffff',
            marginBottom: '25px'
          }}>
            <tr>
              <td>
                <Text style={{ 
                  fontSize: '16px',
                  color: '#1a1a1a',
                  margin: '0 0 15px 0',
                  lineHeight: '24px'
                }}>
                  Liebe/r {firstName},
                </Text>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#4a5568',
                  margin: '0 0 15px 0',
                  lineHeight: '22px'
                }}>
                  wir haben Ihre Anfrage zum Thema <strong>"{subject}"</strong> erhalten und werden uns so schnell wie möglich bei Ihnen melden.
                </Text>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#4a5568',
                  margin: '0 0 15px 0',
                  lineHeight: '22px'
                }}>
                  In der Regel erhalten Sie innerhalb von 1-2 Werktagen eine Antwort von uns.
                </Text>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#4a5568',
                  margin: '0',
                  lineHeight: '22px'
                }}>
                  Mit freundlichen Grüßen,<br />
                  <strong>Ihr Team von Strickerei Jutta</strong>
                </Text>
              </td>
            </tr>
          </table>

          {/* Footer Info */}
          <table width="100%" cellPadding="16" cellSpacing="0" style={{ 
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #e2e8f0'
          }}>
            <tr>
              <td>
                <Text style={{ 
                  fontSize: '12px',
                  color: '#718096',
                  margin: '0 0 8px 0',
                  lineHeight: '18px'
                }}>
                  <strong>Kontaktinformationen:</strong>
                </Text>
                <Text style={{ 
                  fontSize: '12px',
                  color: '#718096',
                  margin: '0 0 4px 0',
                  lineHeight: '18px'
                }}>
                  Strickerei Jutta<br />
                  Wiener Neustädterstraße 47<br />
                  7021 Draßburg<br />
                  Österreich
                </Text>
                <Text style={{ 
                  fontSize: '12px',
                  color: '#718096',
                  margin: '8px 0 0 0',
                  lineHeight: '18px'
                }}>
                  Telefon: +43 2686 2259<br />
                  E-Mail: office@strickerei-jutta.at
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

