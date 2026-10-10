import { Text, Section, Container } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

export const REVOCATION_CONFIRMATION = 'revocation-confirmation'

export interface RevocationConfirmationTemplateProps {
  reference: string
  receivedAt: string
  customerName: string
  orderReference: string
  email: string
  scopeLabel: string
  partialText?: string | null
  declarationText: string
  preview?: string
}

export const isRevocationConfirmationTemplateData = (data: any): data is RevocationConfirmationTemplateProps =>
  typeof data.reference === 'string' &&
  typeof data.receivedAt === 'string' &&
  typeof data.customerName === 'string' &&
  typeof data.orderReference === 'string' &&
  typeof data.email === 'string' &&
  typeof data.scopeLabel === 'string' &&
  typeof data.declarationText === 'string'

const textStyle = {
  fontSize: '14px',
  color: '#57534e',
  margin: '8px 0 0 0',
  lineHeight: '22px',
}

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

export const RevocationConfirmationTemplate: React.FC<RevocationConfirmationTemplateProps> & {
  PreviewProps: RevocationConfirmationTemplateProps
} = ({
  reference,
  receivedAt,
  customerName,
  orderReference,
  email,
  scopeLabel,
  partialText,
  declarationText,
  preview = 'Eingangsbestätigung Ihres Widerrufs',
}) => {
  return (
    <Base preview={preview}>
      <Section>
        <Container style={{ maxWidth: '600px' }}>
          {/* Header */}
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px' }}>
            <tr>
              <td align="center" style={{ paddingBottom: '24px', borderBottom: '1px solid #e7e5e4' }}>
                <Text style={{
                  fontSize: '26px',
                  fontWeight: '500',
                  color: '#1c1917',
                  margin: '0 0 8px 0',
                  fontFamily: 'Georgia, serif'
                }}>
                  Eingangsbestätigung Ihres Widerrufs
                </Text>
                <Text style={{ fontSize: '14px', color: '#78716c', margin: '0' }}>
                  Referenz {reference}
                </Text>
              </td>
            </tr>
          </table>

          <Text style={{ ...textStyle, margin: '0' }}>
            Guten Tag {customerName},
          </Text>
          <Text style={textStyle}>
            wir bestätigen den Eingang Ihrer Widerrufserklärung, die Sie über unsere
            Online-Widerrufsfunktion abgegeben haben.
          </Text>

          {/* Receipt details */}
          <table width="100%" cellPadding="0" cellSpacing="0" style={{
            margin: '20px 0',
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
              <td style={labelStyle}>Referenz</td>
              <td style={valueStyle}>{reference}</td>
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
              <td style={labelStyle}>E-Mail</td>
              <td style={valueStyle}>{email}</td>
            </tr>
          </table>

          {/* Declaration wording */}
          <Text style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: '0' }}>
            Ihre Erklärung im Wortlaut
          </Text>
          <Text style={{
            ...textStyle,
            padding: '12px 16px',
            borderLeft: '3px solid #d6d3d1',
            whiteSpace: 'pre-line',
          }}>
            {declarationText}
          </Text>

          {/* Next steps */}
          <Text style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: '24px 0 0 0' }}>
            Wie geht es weiter?
          </Text>
          <Text style={textStyle}>
            Bitte senden Sie die betroffenen Waren unverzüglich, spätestens jedoch binnen
            vierzehn Tagen ab heute, an folgende Adresse zurück: Ing. Jutta Strobl,
            Wiener Neustädterstraße 47, 7021 Draßburg, Österreich. Die Kosten der
            Rücksendung tragen Sie.
          </Text>
          <Text style={textStyle}>
            Sobald die Ware bei uns eingetroffen ist, erstatten wir Ihnen den Kaufpreis der
            widerrufenen Artikel über dasselbe Zahlungsmittel, das Sie bei der Bestellung
            verwendet haben. Die Kosten der ursprünglichen Standardlieferung erstatten wir
            nur, wenn Sie die gesamte Bestellung widerrufen. Ist die Ware getragen, gewaschen
            oder beschädigt, ziehen wir den dadurch entstandenen Wertverlust vom
            Erstattungsbetrag ab.
          </Text>
          <Text style={textStyle}>
            Bei Fragen antworten Sie einfach auf diese E-Mail oder schreiben Sie an
            office@strickerei-jutta.at.
          </Text>
          <Text style={{ ...textStyle, margin: '24px 0 0 0' }}>
            Herzliche Grüße
            <br />
            Ihre Strickerei Jutta
          </Text>
        </Container>
      </Section>
    </Base>
  )
}

RevocationConfirmationTemplate.PreviewProps = {
  reference: 'WR-000042',
  receivedAt: 'Mittwoch, 23. September 2026 um 15:42:10 Uhr (Ortszeit Wien)',
  customerName: 'Maria Muster',
  orderReference: '#123',
  email: 'maria@example.com',
  scopeLabel: 'Teilweiser Widerruf',
  partialText: 'Strickjacke Alpaka, Größe M',
  declarationText: 'Hiermit widerrufe ich, Maria Muster, den von mir abgeschlossenen Vertrag über folgende Waren der Bestellung #123: Strickjacke Alpaka, Größe M.',
}

export default RevocationConfirmationTemplate
