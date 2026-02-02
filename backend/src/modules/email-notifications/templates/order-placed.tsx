import { Text, Section, Hr, Container, Img } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { OrderDTO, OrderAddressDTO } from '@medusajs/framework/types'

export const ORDER_PLACED = 'order-placed'

interface OrderPlacedPreviewProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
}

export interface OrderPlacedTemplateProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
  preview?: string
}

export const isOrderPlacedTemplateData = (data: any): data is OrderPlacedTemplateProps =>
  typeof data.order === 'object' && typeof data.shippingAddress === 'object'

export const OrderPlacedTemplate: React.FC<OrderPlacedTemplateProps> & {
  PreviewProps: OrderPlacedPreviewProps
} = ({ order, shippingAddress, preview = 'Ihre Bestellung wurde aufgenommen!' }) => {
  // Helper function to format currency
  // Note: Medusa returns prices already in the main currency unit (Euro), not in cents
  const formatCurrency = (amount: number, currencyCode: string) => {
    const formatted = new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
    
    // Replace currency code with symbol
    if (currencyCode.toLowerCase() === 'eur' || currencyCode === 'EUR') {
      return `${formatted} €`
    }
    return `${formatted} ${currencyCode}`
  }

  // Calculate items total
  // In Medusa v2 totals are already in major currency units (e.g. Euro),
  // so we must NOT divide by 100 anywhere here.
  // Prefer the line total; fall back to unit_price * quantity if needed.
  const itemsTotal =
    order.items?.reduce((acc, item) => {
      const lineTotal =
        typeof (item as any).total === "number"
          ? Number((item as any).total)
          : Number((item as any).unit_price || 0) * Number(item.quantity || 1)

      return acc + lineTotal
    }, 0) || 0
  const shippingTotal = (order as any).shipping_total || 0

  return (
  <Base preview={preview}>
  <Section>
    <Container style={{ maxWidth: '600px' }}>
      {/* Success Header */}
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
              Vielen Dank!
            </Text>
            <Text style={{ 
              fontSize: '14px', 
              color: '#57534e',
              margin: '0'
            }}>
              Ihre Bestellung wurde erfolgreich aufgegeben.
            </Text>
          </td>
        </tr>
      </table>

      {/* Persönliche Ansprache */}
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
              Hallo {shippingAddress.first_name} {shippingAddress.last_name},
            </Text>
            <Text style={{ 
              fontSize: '14px',
              color: '#57534e',
              margin: '8px 0 0 0',
              lineHeight: '22px'
            }}>
              wir haben Ihre Bestellung erhalten und werden diese schnellstmöglich bearbeiten. 
              Unten finden Sie alle wichtigen Details zu Ihrer Bestellung.
            </Text>
          </td>
        </tr>
      </table>

      {/* Bestellübersicht */}
      <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px' }}>
        <tr>
          <td>
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '12px' }}>
              <tr>
                <td style={{ paddingBottom: '4px' }}>
                  <Text style={{ fontSize: '14px', color: '#57534e', margin: '0' }}>
                    Bestelldatum:
                  </Text>
                </td>
                <td align="right" style={{ paddingBottom: '4px' }}>
                  <Text style={{ fontSize: '14px', color: '#1c1917', margin: '0' }}>
                    {new Date(order.created_at).toLocaleDateString('de-DE', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '4px' }}>
                  <Text style={{ fontSize: '14px', color: '#57534e', margin: '0' }}>
                    Bestellnummer:
                  </Text>
                </td>
                <td align="right" style={{ paddingBottom: '4px' }}>
                  <Text style={{ fontSize: '14px', fontWeight: '500', color: '#1c1917', margin: '0' }}>
                    #{order.display_id}
                  </Text>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      {/* Bestellte Artikel */}
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
              Bestellübersicht
            </Text>
          </td>
        </tr>
        <tr>
          <td>
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ 
              border: '1px solid #e7e5e4',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {/* Tabellenkopf */}
              <tr style={{ backgroundColor: '#fafaf9' }}>
                <td style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #e7e5e4',
                  width: '80px'
                }}>
                  <Text style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#1c1917', 
                    margin: '0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Bild
                  </Text>
                </td>
                <td style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #e7e5e4'
                }}>
                  <Text style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#1c1917', 
                    margin: '0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Artikel
                  </Text>
                </td>
                <td align="center" style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #e7e5e4'
                }}>
                  <Text style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#1c1917', 
                    margin: '0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Menge
                  </Text>
                </td>
                <td align="right" style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #e7e5e4'
                }}>
                  <Text style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#1c1917', 
                    margin: '0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Preis
                  </Text>
                </td>
              </tr>

              {/* Artikel-Zeilen */}
              {order.items.map((item, index) => (
                <tr key={item.id} style={{ 
                  backgroundColor: '#ffffff'
                }}>
                  <td style={{ 
                    padding: '14px 12px',
                    borderBottom: index < order.items.length - 1 ? '1px solid #e7e5e4' : 'none',
                    width: '80px'
                  }}>
                    {item.thumbnail ? (
                      <Img
                        src={item.thumbnail}
                        alt={item.product_title || 'Produktbild'}
                        width="64"
                        height="64"
                        style={{
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '1px solid #e7e5e4',
                          backgroundColor: '#fafaf9'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '8px',
                        backgroundColor: '#fafaf9',
                        border: '1px solid #e7e5e4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Text style={{ 
                          fontSize: '10px', 
                          color: '#78716c',
                          margin: '0'
                        }}>
                          Kein Bild
                        </Text>
                      </div>
                    )}
                  </td>
                  <td style={{ 
                    padding: '14px 12px',
                    borderBottom: index < order.items.length - 1 ? '1px solid #e7e5e4' : 'none'
                  }}>
                    <Text style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#1c1917', 
                      margin: '0 0 4px 0' 
                    }}>
                      {item.product_title}
                    </Text>
                    {item.title !== item.product_title && (
                      <Text style={{ 
                        fontSize: '13px', 
                        color: '#57534e', 
                        margin: '0' 
                      }}>
                        {item.title}
                      </Text>
                    )}
                  </td>
                  <td align="center" style={{ 
                    padding: '14px 12px',
                    borderBottom: index < order.items.length - 1 ? '1px solid #e7e5e4' : 'none'
                  }}>
                    <Text style={{ 
                      fontSize: '14px', 
                      color: '#57534e', 
                      margin: '0' 
                    }}>
                      {item.quantity}
                    </Text>
                  </td>
                  <td align="right" style={{ 
                    padding: '14px 12px',
                    borderBottom: index < order.items.length - 1 ? '1px solid #e7e5e4' : 'none'
                  }}>
                    <Text
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1c1917",
                        margin: "0",
                      }}
                    >
                      {/* 
                        Zeige den Zeilenpreis (Gesamtpreis für die Menge) in Hauptwährung.
                        Medusa v2 liefert Beträge bereits in Hauptwährung, daher keine Division durch 100.
                      */}
                      {formatCurrency(
                        typeof (item as any).total === "number"
                          ? Number((item as any).total)
                          : Number((item as any).unit_price || 0) *
                            Number(item.quantity || 1),
                        order.currency_code
                      )}
                    </Text>
                  </td>
                </tr>
              ))}
            </table>
          </td>
        </tr>
      </table>

      {/* Gesamtbetrag */}
      <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px', paddingTop: '12px', borderTop: '1px solid #e7e5e4' }}>
        <tr>
          <td>
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '12px' }}>
              <tr>
                <td>
                  <Text style={{ fontSize: '14px', color: '#57534e', margin: '0' }}>
                    Artikel
                  </Text>
                </td>
                <td align="right">
                  <Text style={{ fontSize: '14px', color: '#1c1917', margin: '0' }}>
                    {formatCurrency(itemsTotal, order.currency_code)}
                  </Text>
                </td>
              </tr>
              {shippingTotal > 0 && (
                <tr>
                  <td style={{ paddingTop: '8px' }}>
                    <Text style={{ fontSize: '14px', color: '#57534e', margin: '0' }}>
                      Versand
                    </Text>
                  </td>
                  <td align="right" style={{ paddingTop: '8px' }}>
                    <Text style={{ fontSize: '14px', color: '#1c1917', margin: '0' }}>
                      {formatCurrency(shippingTotal, order.currency_code)}
                    </Text>
                  </td>
                </tr>
              )}
            </table>
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ paddingTop: '12px', borderTop: '1px solid #e7e5e4' }}>
              <tr>
                <td>
                  <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1c1917', margin: '0' }}>
                    Gesamt
                  </Text>
                </td>
                <td align="right">
                  <Text style={{ fontSize: '20px', fontWeight: '700', color: '#1c1917', margin: '0' }}>
                    {formatCurrency(order.summary.raw_current_order_total.value, order.currency_code)}
                  </Text>
                  <Text style={{ fontSize: '12px', color: '#57534e', margin: '4px 0 0 0', display: 'block' }}>
                    inkl. MwSt.
                  </Text>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      {/* Lieferadresse */}
      <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px', paddingTop: '24px', borderTop: '1px solid #e7e5e4' }}>
        <tr>
          <td>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td>
                  <Text style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#1c1917', 
                    margin: '0 0 8px 0' 
                  }}>
                    Lieferadresse
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#57534e', 
                    margin: '0 0 2px 0',
                    lineHeight: '20px'
                  }}>
                    {shippingAddress.first_name} {shippingAddress.last_name}
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#57534e', 
                    margin: '0 0 2px 0',
                    lineHeight: '20px'
                  }}>
                    {shippingAddress.address_1}
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#57534e', 
                    margin: '0 0 2px 0',
                    lineHeight: '20px'
                  }}>
                    {shippingAddress.postal_code} {shippingAddress.city}
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#57534e', 
                    margin: '0',
                    lineHeight: '20px'
                  }}>
                    {shippingAddress.province ? `${shippingAddress.province}, ` : ''}{shippingAddress.country_code}
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
              Bei Fragen zu Ihrer Bestellung kontaktieren Sie uns gerne unter{' '}
              <a href="mailto:office@strickerei-jutta.at" style={{ color: '#1c1917', textDecoration: 'underline' }}>
                office@strickerei-jutta.at
              </a>
            </Text>
            <Text style={{ 
              fontSize: '12px', 
              color: '#78716c', 
              margin: '0' 
            }}>
              Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese Nachricht.
            </Text>
          </td>
        </tr>
      </table>
    </Container>
  </Section>
</Base>
  )
}

OrderPlacedTemplate.PreviewProps = {
  order: {
    id: 'test-order-id',
    display_id: 'ORD-123',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
    currency_code: 'USD',
    items: [
      { id: 'item-1', title: 'Item 1', product_title: 'Product 1', quantity: 2, unit_price: 10 },
      { id: 'item-2', title: 'Item 2', product_title: 'Product 2', quantity: 1, unit_price: 25 }
    ],
    shipping_address: {
      first_name: 'Test',
      last_name: 'User',
      address_1: '123 Main St',
      city: 'Anytown',
      province: 'CA',
      postal_code: '12345',
      country_code: 'US'
    },
    summary: { raw_current_order_total: { value: 45 } }
  },
  shippingAddress: {
    first_name: 'Test',
    last_name: 'User',
    address_1: '123 Main St',
    city: 'Anytown',
    province: 'CA',
    postal_code: '12345',
    country_code: 'US'
  }
} as OrderPlacedPreviewProps

export default OrderPlacedTemplate
