import { Text, Section, Hr, Container, Img } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { OrderDTO, OrderAddressDTO, FulfillmentDTO } from '@medusajs/framework/types'

export const SHIPMENT_DELIVERED = 'shipment-delivered'

interface ShipmentDeliveredPreviewProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  fulfillment: FulfillmentDTO
  shippingAddress: OrderAddressDTO
  companyLogo?: string
}

export interface ShipmentDeliveredTemplateProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  fulfillment: FulfillmentDTO
  shippingAddress: OrderAddressDTO
  preview?: string
  companyLogo?: string
}

export const isShipmentDeliveredTemplateData = (data: any): data is ShipmentDeliveredTemplateProps =>
 typeof data.order === 'object' && typeof data.shippingAddress === 'object'

export const ShipmentDeliveredTemplate: React.FC<ShipmentDeliveredTemplateProps> & {
  PreviewProps: ShipmentDeliveredPreviewProps
} = ({ order, fulfillment, shippingAddress, preview = 'Your order has been delivered!', companyLogo }) => {
  return (
    <Base preview={preview}>
  <Section>
    <Container style={{ maxWidth: '600px' }}>
      {/* Header */}
      <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '30px' }}>
        <tr>
          <td align="center" style={{ paddingBottom: '24px', borderBottom: '1px solid #e7e5e4' }}>
            {companyLogo && (
              <Img
                src={companyLogo}
                alt="Logo"
                width="120"
                height="60"
                style={{ 
                  margin: '0 auto 16px auto',
                  display: 'block'
                }}
              />
            )}
            <Text style={{ 
              fontSize: '30px', 
              fontWeight: '500', 
              color: '#1c1917',
              margin: '0 0 8px 0',
              fontFamily: 'Georgia, serif'
            }}>
              Ihre Bestellung wurde erfolgreich zugestellt!
            </Text>
            <Text style={{ 
              fontSize: '14px', 
              color: '#57534e',
              margin: '0'
            }}>
              Zustellbestätigung
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
              Gute Nachrichten! Ihre Bestellung wurde erfolgreich an Ihre Lieferadresse zugestellt. 
              Wir hoffen, Sie sind mit Ihrem Einkauf zufrieden.
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
              <tr>
                <td style={{ paddingBottom: '4px' }}>
                  <Text style={{ fontSize: '14px', color: '#57534e', margin: '0' }}>
                    Zustelldatum:
                  </Text>
                </td>
                <td align="right" style={{ paddingBottom: '4px' }}>
                  <Text style={{ fontSize: '14px', fontWeight: '500', color: '#16a34a', margin: '0' }}>
                    {new Date().toLocaleDateString('de-DE', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      {/* Gelieferte Artikel */}
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
              Gelieferte Artikel
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
                </tr>
              ))}
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
                  {shippingAddress.address_2 && (
                    <Text style={{ 
                      fontSize: '14px', 
                      color: '#57534e', 
                      margin: '0 0 2px 0',
                      lineHeight: '20px'
                    }}>
                      {shippingAddress.address_2}
                    </Text>
                  )}
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
              Vielen Dank für Ihren Einkauf! Bei Fragen zu Ihrer Bestellung kontaktieren Sie uns gerne unter{' '}
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

// Define properly typed preview props
ShipmentDeliveredTemplate.PreviewProps = {
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
        id: 'shipping-address-id',
        first_name: 'Test',
        last_name: 'User',
        address_1: '123 Main St',
        city: 'Anytown',
        province: 'CA',
        postal_code: '12345',
        country_code: 'US'
      },
      summary: { raw_current_order_total: { value: 45 } }
    } as unknown as OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } },
    fulfillment: {
      id: 'test-fulfillment-id',
      created_at: new Date().toISOString(),
      tracking_number: 'TRK12345678',
      tracking_url: 'https://tracking.carrier.com/TRK12345678',
      items: [
        { item_id: 'item-1', quantity: 2 },
        { item_id: 'item-2', quantity: 1 }
      ],
      order_id: 'test-order-id'
    } as unknown as FulfillmentDTO,
    shippingAddress: {
      id: 'shipping-address-id',
      first_name: 'Test',
      last_name: 'User',
      address_1: '123 Main St',
      city: 'Anytown',
      province: 'CA',
      postal_code: '12345',
      country_code: 'US'
    } as OrderAddressDTO
  } as ShipmentDeliveredPreviewProps

export default ShipmentDeliveredTemplate