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
              <td align="center" style={{ 
                backgroundColor: '#1c1917', 
                padding: '20px',
                borderRadius: '8px 8px 0 0'
              }}>
                <Text style={{ 
                  fontSize: '26px', 
                  fontWeight: 'bold', 
                  color: '#ffffff',
                  margin: '0 0 8px 0'
                }}>
                  Neue Kontaktanfrage
                </Text>
                <Text style={{ 
                  fontSize: '14px', 
                  color: '#d6d3d1',
                  margin: '0'
                }}>
                  Sie haben eine neue Nachricht über das Kontaktformular erhalten
                </Text>
              </td>
            </tr>
          </table>

          {/* Kontaktinformationen */}
          <table width="100%" cellPadding="20" cellSpacing="0" style={{ 
            backgroundColor: '#f8f9fa', 
            marginBottom: '25px',
            border: '1px solid #e2e8f0'
          }}>
            <tr>
              <td>
                <Text style={{ 
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  margin: '0 0 15px 0'
                }}>
                  Kontaktinformationen
                </Text>
                <table width="100%" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td style={{ paddingBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: '#718096', margin: '0', display: 'inline' }}>
                        <strong>Name:</strong>
                      </Text>
                      <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0 0 0 8px', display: 'inline' }}>
                        {firstName} {lastName}
                      </Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: '#718096', margin: '0', display: 'inline' }}>
                        <strong>E-Mail:</strong>
                      </Text>
                      <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0 0 0 8px', display: 'inline' }}>
                        <a href={`mailto:${email}`} style={{ color: '#059669', textDecoration: 'none' }}>
                          {email}
                        </a>
                      </Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: '#718096', margin: '0', display: 'inline' }}>
                        <strong>Telefon:</strong>
                      </Text>
                      <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0 0 0 8px', display: 'inline' }}>
                        {phone}
                      </Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: '#718096', margin: '0', display: 'inline' }}>
                        <strong>Betreff:</strong>
                      </Text>
                      <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0 0 0 8px', display: 'inline' }}>
                        {subject}
                      </Text>
                    </td>
                  </tr>
                  {submittedAt && (
                    <tr>
                      <td>
                        <Text style={{ fontSize: '14px', color: '#718096', margin: '0', display: 'inline' }}>
                          <strong>Eingegangen am:</strong>
                        </Text>
                        <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0 0 0 8px', display: 'inline' }}>
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
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '30px' }}>
            <tr>
              <td>
                <Text style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#1a1a1a',
                  margin: '0 0 15px 0',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  Nachricht
                </Text>
              </td>
            </tr>
            <tr>
              <td>
                <table width="100%" cellPadding="16" cellSpacing="0" style={{ 
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff'
                }}>
                  <tr>
                    <td>
                      <Text style={{ 
                        fontSize: '14px', 
                        color: '#4a5568', 
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
            borderTop: '1px solid #e2e8f0', 
            margin: '35px 0 20px 0' 
          }} />
          
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              <td align="center">
                <Text style={{ 
                  fontSize: '13px', 
                  color: '#718096', 
                  margin: '0 0 8px 0',
                  lineHeight: '20px'
                }}>
                  <strong>Sie können direkt auf diese E-Mail antworten, um dem Kunden zu schreiben.</strong>
                </Text>
                <Text style={{ 
                  fontSize: '12px', 
                  color: '#a0aec0', 
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

