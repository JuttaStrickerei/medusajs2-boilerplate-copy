import { Text, Section, Container } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

export const REVOCATION_ADMIN = 'revocation-admin'

export interface RevocationAdminTemplateProps {
  reference: string
  receivedAt: string
  customerName: string
  orderReference: string
  email: string
  scopeLabel: string
  partialText?: string | null
  declarationText: string
  confirmationSent: boolean
  preview?: string
}

export const isRevocationAdminTemplateData = (data: any): data is RevocationAdminTemplateProps =>
  typeof data.reference === 'string' &&
  typeof data.receivedAt === 'string' &&
  typeof data.customerName === 'string' &&
  typeof data.orderReference === 'string' &&
  typeof data.email === 'string' &&
  typeof data.scopeLabel === 'string' &&
  typeof data.declarationText === 'string' &&
  typeof data.confirmationSent === 'boolean'

const labelStyle = {
  fontSize: '13px',
  color: '#78716c',
  padding: '6px 12px 6px 0',
  verticalAlign: 'top' as const,
  whiteSpace: 'nowrap' as const,
}

const valueStyle = {
  fontSize: '14px',
  color: '#1c1917',
  padding: '6px 0',
  verticalAlign: 'top' as const,
}

export const RevocationAdminTemplate: React.FC<RevocationAdminTemplateProps> & {
  PreviewProps: RevocationAdminTemplateProps
} = ({
  reference,
  receivedAt,
  customerName,
  orderReference,
  email,
  scopeLabel,
  partialText,
  declarationText,
  confirmationSent,
  preview = 'Neuer Online-Widerruf eingegangen',
}) => {
  return (
    <Base preview={preview}>
      <Section>
        <Container style={{ maxWidth: '600px' }}>
          <Text style={{
            fontSize: '22px',
            fontWeight: '500',
            color: '#1c1917',
            margin: '0 0 16px 0',
            fontFamily: 'Georgia, serif'
          }}>
            Neuer Online-Widerruf {reference}
          </Text>

          {!confirmationSent && (
            <Text style={{
              fontSize: '14px',
              color: '#991b1b',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 16px',
              margin: '0 0 16px 0',
              lineHeight: '22px',
            }}>
              <strong>Bestätigung an Kunden NICHT versendet – bitte manuell senden.</strong>
              <br />
              Die Eingangsbestätigung muss unverzüglich mit Inhalt der Erklärung sowie
              Datum und Uhrzeit des Eingangs an {email} gehen.
            </Text>
          )}

          <table width="100%" cellPadding="0" cellSpacing="0" style={{
            padding: '16px',
            backgroundColor: '#fafaf9',
            border: '1px solid #e7e5e4',
            borderRadius: '8px',
          }}>
            <tr>
              <td style={labelStyle}>Eingegangen am</td>
              <td style={{ ...valueStyle, fontWeight: 600 }}>{receivedAt}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Name</td>
              <td style={valueStyle}>{customerName}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Bestell-/Rechnungsnr.</td>
              <td style={valueStyle}>{orderReference}</td>
            </tr>
            <tr>
              <td style={labelStyle}>E-Mail</td>
              <td style={valueStyle}>{email}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Umfang</td>
              <td style={valueStyle}>{scopeLabel}</td>
            </tr>
            {partialText && (
              <tr>
                <td style={labelStyle}>Betroffene Artikel</td>
                <td style={{ ...valueStyle, whiteSpace: 'pre-line' }}>{partialText}</td>
              </tr>
            )}
            <tr>
              <td style={labelStyle}>Bestätigung an Kunden</td>
              <td style={valueStyle}>{confirmationSent ? 'versendet' : 'FEHLGESCHLAGEN'}</td>
            </tr>
          </table>

          <Text style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: '20px 0 0 0' }}>
            Erklärung im Wortlaut
          </Text>
          <Text style={{
            fontSize: '14px',
            color: '#57534e',
            lineHeight: '22px',
            margin: '8px 0 0 0',
            padding: '12px 16px',
            borderLeft: '3px solid #d6d3d1',
            whiteSpace: 'pre-line',
          }}>
            {declarationText}
          </Text>

          <Text style={{ fontSize: '13px', color: '#78716c', margin: '20px 0 0 0', lineHeight: '20px' }}>
            Rücksendung und Rückerstattung bitte wie gewohnt im Medusa-Admin bearbeiten.
            Rückzahlung spätestens 14 Tage nach Eingang des Widerrufs (Zurückbehaltung bis
            zum Erhalt der Ware bzw. Nachweis der Rücksendung zulässig).
          </Text>
        </Container>
      </Section>
    </Base>
  )
}

RevocationAdminTemplate.PreviewProps = {
  reference: 'WR-000042',
  receivedAt: 'Mittwoch, 23. September 2026 um 15:42:10 Uhr (Ortszeit Wien)',
  customerName: 'Maria Muster',
  orderReference: '#123',
  email: 'maria@example.com',
  scopeLabel: 'Vollständiger Widerruf',
  partialText: null,
  declarationText: 'Hiermit widerrufe ich, Maria Muster, den von mir abgeschlossenen Vertrag über sämtliche Waren der Bestellung #123.',
  confirmationSent: false,
}

export default RevocationAdminTemplate
