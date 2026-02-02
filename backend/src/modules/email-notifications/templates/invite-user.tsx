import { Button, Link, Section, Text, Hr, Container } from '@react-email/components'
import { Base } from './base'

/**
 * The key for the InviteUserEmail template, used to identify it
 */
export const INVITE_USER = 'invite-user'

/**
 * The props for the InviteUserEmail template
 */
export interface InviteUserEmailProps {
  /**
   * The link that the user can click to accept the invitation
   */
  inviteLink: string
  /**
   * The preview text for the email, appears next to the subject
   * in mail providers like Gmail
   */
  preview?: string
}

/**
 * Type guard for checking if the data is of type InviteUserEmailProps
 * @param data - The data to check
 */
export const isInviteUserData = (data: any): data is InviteUserEmailProps =>
  typeof data.inviteLink === 'string' && (typeof data.preview === 'string' || !data.preview)

/**
 * The InviteUserEmail template component built with react-email
 */
export const InviteUserEmail = ({
  inviteLink,
  preview = `You've been invited to Medusa!`,
}: InviteUserEmailProps) => {
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
                  Einladung
                </Text>
                <Text style={{ 
                  fontSize: '14px', 
                  color: '#57534e',
                  margin: '0'
                }}>
                  Sie wurden als Administrator eingeladen
                </Text>
              </td>
            </tr>
          </table>

          {/* Content */}
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px' }}>
            <tr>
              <td align="center">
                <Text style={{ 
                  fontSize: '14px',
                  color: '#57534e',
                  margin: '0 0 24px 0',
                  lineHeight: '22px'
                }}>
                  Sie wurden eingeladen, Administrator zu werden.
                </Text>
                <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px', textAlign: 'center' }}>
                  <tr>
                    <td>
                      <Button
                        style={{
                          backgroundColor: '#1c1917',
                          color: '#ffffff',
                          padding: '14px 32px',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '500',
                          display: 'inline-block'
                        }}
                        href={inviteLink}
                      >
                        Einladung annehmen
                      </Button>
                    </td>
                  </tr>
                </table>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#57534e',
                  margin: '0 0 12px 0',
                  lineHeight: '22px'
                }}>
                  oder kopieren Sie diese URL in Ihren Browser:
                </Text>
                <Text style={{
                  maxWidth: '100%',
                  wordBreak: 'break-all',
                  overflowWrap: 'break-word',
                  fontSize: '13px',
                  color: '#1c1917'
                }}>
                  <Link
                    href={inviteLink}
                    style={{ color: '#1c1917', textDecoration: 'underline' }}
                  >
                    {inviteLink}
                  </Link>
                </Text>
              </td>
            </tr>
          </table>

          {/* Footer */}
          <Hr style={{ 
            borderTop: '1px solid #e7e5e4', 
            margin: '24px 0 20px 0' 
          }} />
          <Text style={{ 
            fontSize: '12px',
            color: '#78716c',
            lineHeight: '18px',
            margin: '0'
          }}>
            Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren. Die Einladung läuft in 24 Stunden ab. 
            Wenn Sie Bedenken bezüglich der Sicherheit Ihres Kontos haben, antworten Sie bitte auf diese E-Mail.
          </Text>
        </Container>
      </Section>
    </Base>
  )
}

InviteUserEmail.PreviewProps = {
  inviteLink: 'https://mywebsite.com/app/invite?token=abc123ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'
} as InviteUserEmailProps

export default InviteUserEmail
