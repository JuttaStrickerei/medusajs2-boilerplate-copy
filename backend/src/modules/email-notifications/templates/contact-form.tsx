import { Text, Section, Hr, Container } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

export const CONTACT_FORM = 'contact-form'

interface ContactFormPreviewProps {
  firstName: string
  lastName: string
  email: string
  phone: string
  subject: string
  message: string
}

export interface ContactFormTemplateProps {
  firstName: string
  lastName: string
  email: string
  phone: string
  subject: string
  message: string
  submittedAt?: string
  preview?: string
}

export const isContactFormTemplateData = (data: any): data is ContactFormTemplateProps =>
  typeof data.firstName === 'string' &&
  typeof data.lastName === 'string' &&
  typeof data.email === 'string' &&
  typeof data.phone === 'string' &&
  typeof data.subject === 'string' &&
  typeof data.message === 'string'

export const ContactFormTemplate: React.FC<ContactFormTemplateProps> & {
  PreviewProps: ContactFormPreviewProps
} = ({ firstName, lastName, email, phone, subject, message, submittedAt, preview = 'Neue Kontaktanfrage von der Website' }) => {
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
                  Neue Kontaktanfrage
                </Text>
                <Text style={{ 
                  fontSize: '14px', 
                  color: '#57534e',
                  margin: '0'
                }}>
                  Sie haben eine neue Nachricht über das Kontaktformular erhalten
                </Text>
              </td>
            </tr>
          </table>

          {/* Kontaktinformationen */}
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ 
            marginBottom: '24px',
            padding: '16px',
            border: '1px solid #e7e5e4',
            borderRadius: '8px',
            backgroundColor: '#fafaf9'
          }}>
            <tr>
              <td>
                <Text style={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1c1917',
                  margin: '0 0 12px 0'
                }}>
                  Kontaktinformationen
                </Text>
                <table width="100%" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td style={{ paddingBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: '#57534e', margin: '0', display: 'inline' }}>
                        <strong style={{ color: '#1c1917' }}>Name:</strong>
                      </Text>
                      <Text style={{ fontSize: '14px', color: '#1c1917', margin: '0 0 0 8px', display: 'inline' }}>
                        {firstName} {lastName}
                      </Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: '#57534e', margin: '0', display: 'inline' }}>
                        <strong style={{ color: '#1c1917' }}>E-Mail:</strong>
                      </Text>
                      <Text style={{ fontSize: '14px', color: '#1c1917', margin: '0 0 0 8px', display: 'inline' }}>
                        <a href={`mailto:${email}`} style={{ color: '#1c1917', textDecoration: 'underline' }}>
                          {email}
                        </a>
                      </Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: '#57534e', margin: '0', display: 'inline' }}>
                        <strong style={{ color: '#1c1917' }}>Telefon:</strong>
                      </Text>
                      <Text style={{ fontSize: '14px', color: '#1c1917', margin: '0 0 0 8px', display: 'inline' }}>
                        {phone}
                      </Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: '#57534e', margin: '0', display: 'inline' }}>
                        <strong style={{ color: '#1c1917' }}>Betreff:</strong>
                      </Text>
                      <Text style={{ fontSize: '14px', color: '#1c1917', margin: '0 0 0 8px', display: 'inline' }}>
                        {subject}
                      </Text>
                    </td>
                  </tr>
                  {submittedAt && (
                    <tr>
                      <td>
                        <Text style={{ fontSize: '14px', color: '#57534e', margin: '0', display: 'inline' }}>
                          <strong style={{ color: '#1c1917' }}>Eingegangen am:</strong>
                        </Text>
                        <Text style={{ fontSize: '14px', color: '#1c1917', margin: '0 0 0 8px', display: 'inline' }}>
                          {submittedAt}
                        </Text>
                      </td>
                    </tr>
                  )}
                </table>
              </td>
            </tr>
          </table>

          {/* Nachricht */}
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px', paddingTop: '24px', borderTop: '1px solid #e7e5e4' }}>
            <tr>
              <td>
                <Text style={{ 
                  fontSize: '20px', 
                  fontWeight: '500', 
                  color: '#1c1917',
                  margin: '0 0 16px 0',
                  fontFamily: 'Georgia, serif'
                }}>
                  Nachricht
                </Text>
              </td>
            </tr>
            <tr>
              <td>
                <table width="100%" cellPadding="16" cellSpacing="0" style={{ 
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff'
                }}>
                  <tr>
                    <td>
                      <Text style={{ 
                        fontSize: '14px', 
                        color: '#57534e', 
                        margin: '0',
                        lineHeight: '22px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {message}
                      </Text>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          {/* Footer */}
          <Hr style={{ 
            borderTop: '1px solid #e7e5e4', 
            margin: '24px 0 20px 0' 
          }} />
          
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              <td align="center">
                <Text style={{ 
                  fontSize: '13px', 
                  color: '#57534e', 
                  margin: '0 0 8px 0',
                  lineHeight: '20px'
                }}>
                  <strong style={{ color: '#1c1917' }}>Sie können direkt auf diese E-Mail antworten, um dem Kunden zu schreiben.</strong>
                </Text>
                <Text style={{ 
                  fontSize: '12px', 
                  color: '#78716c', 
                  margin: '0' 
                }}>
                  Diese E-Mail wurde automatisch über das Kontaktformular auf strickerei-jutta.at generiert.
                </Text>
              </td>
            </tr>
          </table>
        </Container>
      </Section>
    </Base>
  )
}

ContactFormTemplate.PreviewProps = {
  firstName: 'Max',
  lastName: 'Mustermann',
  email: 'max.mustermann@example.com',
  phone: '+43 123 456789',
  subject: 'Produktanfrage',
  message: 'Guten Tag,\n\nich interessiere mich für Ihre Produkte und hätte gerne weitere Informationen.\n\nVielen Dank!\n\nMit freundlichen Grüßen\nMax Mustermann',
  submittedAt: new Date().toLocaleString("de-AT", { dateStyle: "full", timeStyle: "short" })
} as ContactFormPreviewProps

export default ContactFormTemplate

