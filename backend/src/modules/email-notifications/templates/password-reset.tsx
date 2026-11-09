import { Text, Section, Container, Link, Hr } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

export const PASSWORD_RESET = 'password-reset'

export interface PasswordResetTemplateProps {
  resetUrl: string
  // "customer" = Kundin im Shop, "user" = Mitarbeiter:in im Admin
  actorType?: string
  preview?: string
}

export const isPasswordResetTemplateData = (data: any): data is PasswordResetTemplateProps =>
  typeof data?.resetUrl === 'string' &&
  /^https?:\/\//.test(data.resetUrl) &&
  (data.actorType === undefined || typeof data.actorType === 'string')

const textStyle = {
  fontSize: '14px',
  color: '#57534e',
  margin: '0 0 12px 0',
  lineHeight: '22px',
}

export const PasswordResetTemplate: React.FC<PasswordResetTemplateProps> & {
  PreviewProps: PasswordResetTemplateProps
} = ({ resetUrl, actorType, preview = 'Ihr Link für ein neues Passwort' }) => {
  const isAdmin = actorType === 'user'

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
                  Neues Passwort festlegen
                </Text>
              </td>
            </tr>
          </table>

          {/* Content */}
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px' }}>
            <tr>
              <td>
                <Text style={textStyle}>Guten Tag,</Text>
                <Text style={textStyle}>
                  {isAdmin
                    ? 'für Ihren Zugang zur Shop-Verwaltung der Strickerei Jutta wurde ein neues Passwort angefordert.'
                    : 'für Ihr Kundenkonto im Onlineshop der Strickerei Jutta wurde ein neues Passwort angefordert.'}
                  {' '}Mit dem folgenden Knopf legen Sie es fest:
                </Text>

                {/* CTA Button */}
                <table width="100%" cellPadding="0" cellSpacing="0" style={{ margin: '24px 0', textAlign: 'center' }}>
                  <tr>
                    <td>
                      <Link
                        href={resetUrl}
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
                        Neues Passwort festlegen
                      </Link>
                    </td>
                  </tr>
                </table>

                <Text style={textStyle}>
                  Der Link ist aus Sicherheitsgründen nur 15 Minuten gültig. Danach können Sie
                  einfach einen neuen anfordern.
                </Text>
                <Text style={textStyle}>
                  Sie haben kein neues Passwort angefordert? Dann können Sie diese E-Mail
                  ignorieren. Ihr bisheriges Passwort bleibt gültig.
                </Text>
                <Text style={{ ...textStyle, fontSize: '12px', color: '#78716c' }}>
                  Falls der Knopf nicht funktioniert, kopieren Sie diese Adresse in Ihren Browser:
                  <br />
                  <Link href={resetUrl} style={{ color: '#78716c', wordBreak: 'break-all' }}>
                    {resetUrl}
                  </Link>
                </Text>
              </td>
            </tr>
          </table>

          {/* Footer */}
          <Hr style={{ borderTop: '1px solid #e7e5e4', margin: '24px 0 20px 0' }} />
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ textAlign: 'center' }}>
            <tr>
              <td>
                <Text style={{ fontSize: '13px', color: '#57534e', margin: '0 0 8px 0', lineHeight: '20px' }}>
                  Strickerei Jutta<br />
                  Wiener Neustädterstraße 47, 7021 Draßburg
                </Text>
                <Text style={{ fontSize: '13px', color: '#57534e', margin: '0', lineHeight: '20px' }}>
                  <Link href="tel:+4326862259" style={{ color: '#1c1917', textDecoration: 'underline' }}>
                    +43 2686 2259
                  </Link>
                  {' · '}
                  <Link href="mailto:office@strickerei-jutta.at" style={{ color: '#1c1917', textDecoration: 'underline' }}>
                    office@strickerei-jutta.at
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

PasswordResetTemplate.PreviewProps = {
  resetUrl: 'https://shop.strickerei-jutta.at/api/reset-password?token=beispiel',
  actorType: 'customer',
} as PasswordResetTemplateProps

export default PasswordResetTemplate
