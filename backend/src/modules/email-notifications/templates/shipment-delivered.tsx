import { Text, Section, Hr, Container } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { OrderDTO, OrderAddressDTO, FulfillmentDTO } from '@medusajs/framework/types'

export const SHIPMENT_DELIVERED = 'shipment-delivered'

interface ShipmentDeliveredPreviewProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  fulfillment: FulfillmentDTO
  shippingAddress: OrderAddressDTO
}

export interface ShipmentDeliveredTemplateProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  fulfillment: FulfillmentDTO
  shippingAddress: OrderAddressDTO
  preview?: string
}

export const isShipmentDeliveredTemplateData = (data: any): data is ShipmentDeliveredTemplateProps =>
 typeof data.order === 'object' && typeof data.shippingAddress === 'object'

export const ShipmentDeliveredTemplate: React.FC<ShipmentDeliveredTemplateProps> & {
  PreviewProps: ShipmentDeliveredPreviewProps
} = ({ order, fulfillment, shippingAddress, preview = 'Your order has been delivered!' }) => {
  return (
    <Base preview={preview}>
  <Section>
    <Container style={{ maxWidth: '600px' }}>
      {/* Header */}
      <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '30px' }}>
        <tr>
          <td align="center">
            <Text style={{ 
              fontSize: '26px', 
              fontWeight: 'bold', 
              color: '#1a1a1a',
              margin: '0 0 8px 0'
            }}>
              Zustellbestätigung
            </Text>
            <Text style={{ 
              fontSize: '14px', 
              color: '#666666',
              margin: '0'
            }}>
              Ihre Bestellung wurde erfolgreich zugestellt!
            </Text>
          </td>
        </tr>
      </table>

      {/* Persönliche Ansprache */}
      <table width="100%" cellPadding="20" cellSpacing="0" style={{ 
        backgroundColor: '#f8f9fa', 
        marginBottom: '25px'
      }}>
        <tr>
          <td>
            <Text style={{ 
              fontSize: '16px',
              color: '#1a1a1a',
              margin: '0 0 12px 0'
            }}>
              Hallo {shippingAddress.first_name} {shippingAddress.last_name},
            </Text>
            <Text style={{ 
              fontSize: '14px',
              color: '#4a5568',
              margin: '0',
              lineHeight: '22px'
            }}>
              Gute Nachrichten! Ihre Bestellung wurde erfolgreich an Ihre Lieferadresse zugestellt. 
              Wir hoffen, Sie sind mit Ihrem Einkauf zufrieden.
            </Text>
          </td>
        </tr>
      </table>

      {/* Bestellübersicht */}
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
              Bestellübersicht
            </Text>
          </td>
        </tr>
        <tr>
          <td>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td style={{ paddingBottom: '8px' }}>
                  <Text style={{ fontSize: '14px', color: '#718096', margin: '0' }}>
                    Bestellnummer:
                  </Text>
                </td>
                <td align="right" style={{ paddingBottom: '8px' }}>
                  <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a1a', margin: '0' }}>
                    #{order.display_id}
                  </Text>
                </td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '8px' }}>
                  <Text style={{ fontSize: '14px', color: '#718096', margin: '0' }}>
                    Bestelldatum:
                  </Text>
                </td>
                <td align="right" style={{ paddingBottom: '8px' }}>
                  <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0' }}>
                    {new Date(order.created_at).toLocaleDateString('de-DE', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '12px' }}>
                  <Text style={{ fontSize: '14px', color: '#718096', margin: '0' }}>
                    Zustelldatum:
                  </Text>
                </td>
                <td align="right" style={{ paddingBottom: '12px' }}>
                  <Text style={{ fontSize: '14px', fontWeight: '500', color: '#059669', margin: '0' }}>
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
              Gelieferte Artikel
            </Text>
          </td>
        </tr>
        <tr>
          <td>
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ 
              border: '1px solid #e2e8f0'
            }}>
              {/* Tabellenkopf */}
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <td style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <Text style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    color: '#4a5568', 
                    margin: '0',
                    textTransform: 'uppercase'
                  }}>
                    Artikel
                  </Text>
                </td>
                <td align="center" style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <Text style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    color: '#4a5568', 
                    margin: '0',
                    textTransform: 'uppercase'
                  }}>
                    Menge
                  </Text>
                </td>
              </tr>

              {/* Artikel-Zeilen (Dieser Teil bleibt identisch) */}
              {order.items.map((item, index) => (
                <tr key={item.id} style={{ 
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc' 
                }}>
                  <td style={{ 
                    padding: '14px 12px',
                    borderBottom: index < order.items.length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}>
                    <Text style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#1a1a1a', 
                      margin: '0 0 4px 0' 
                    }}>
                      {item.product_title}
                    </Text>
                    {item.title !== item.product_title && (
                      <Text style={{ 
                        fontSize: '13px', 
                        color: '#718096', 
                        margin: '0' 
                      }}>
                        {item.title}
                      </Text>
                    )}
                  </td>
                  <td align="center" style={{ 
                    padding: '14px 12px',
                    borderBottom: index < order.items.length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}>
                    <Text style={{ 
                      fontSize: '14px', 
                      color: '#4a5568', 
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
              Lieferadresse
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
                    fontWeight: '500', 
                    color: '#1a1a1a', 
                    margin: '0 0 8px 0' 
                  }}>
                    {shippingAddress.first_name} {shippingAddress.last_name}
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#4a5568', 
                    margin: '0 0 4px 0' 
                  }}>
                    {shippingAddress.address_1}
                  </Text>
                  {shippingAddress.address_2 && (
                    <Text style={{ 
                      fontSize: '14px', 
                      color: '#4a5568', 
                      margin: '0 0 4px 0' 
                    }}>
                      {shippingAddress.address_2}
                    </Text>
                  )}
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#4a5568', 
                    margin: '0 0 4px 0' 
                  }}>
                    {shippingAddress.postal_code} {shippingAddress.city}
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#4a5568', 
                    margin: '0' 
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
              Vielen Dank für Ihren Einkauf! Bei Fragen zu Ihrer Bestellung kontaktieren Sie uns gerne unter office@strickere-jutta.at
            </Text>
            <Text style={{ 
              fontSize: '12px', 
              color: '#a0aec0', 
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