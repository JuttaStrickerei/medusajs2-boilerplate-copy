import { Text, Section, Hr } from '@react-email/components'
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
} = ({ order, shippingAddress, preview = 'Ihre Bestellung wurde erfolgreich aufgegeben!' }) => {
  return (
    <Base preview={preview}>
      <Section style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Header */}
        <Section style={{ 
          backgroundColor: '#1a1a1a', 
          padding: '30px',
          marginBottom: '0'
        }}>
          <Text style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            textAlign: 'center', 
            color: '#ffffff',
            margin: '0',
            letterSpacing: '-0.5px'
          }}>
            ✓ Bestellbestätigung
          </Text>
          <Text style={{ 
            fontSize: '14px', 
            textAlign: 'center', 
            color: '#a0a0a0',
            margin: '10px 0 0 0'
          }}>
            Vielen Dank für Ihre Bestellung!
          </Text>
        </Section>

        {/* Hauptinhalt */}
        <Section style={{ 
          backgroundColor: '#ffffff',
          padding: '30px',
          border: '1px solid #e5e5e5',
          borderTop: 'none'
        }}>
          
          {/* Persönliche Anrede */}
          <Text style={{ 
            fontSize: '16px',
            color: '#333333',
            margin: '0 0 25px 0',
            lineHeight: '24px'
          }}>
            Liebe(r) <strong>{shippingAddress.first_name} {shippingAddress.last_name}</strong>,
          </Text>
          
          <Text style={{ 
            fontSize: '15px',
            color: '#555555',
            margin: '0 0 30px 0',
            lineHeight: '24px'
          }}>
            wir haben Ihre Bestellung erhalten und werden sie schnellstmöglich bearbeiten. 
            Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versandt wurde.
          </Text>

          {/* Bestellinfo Box */}
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '25px'
          }}>
            <Text style={{ 
              fontSize: '13px',
              color: '#6b7280',
              margin: '0 0 8px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 'bold'
            }}>
              Bestelldetails
            </Text>
            <Text style={{ 
              fontSize: '16px',
              color: '#111827',
              margin: '0 0 8px 0'
            }}>
              <strong>Bestellnummer:</strong> {order.display_id}
            </Text>
            <Text style={{ 
              fontSize: '16px',
              color: '#111827',
              margin: '0'
            }}>
              <strong>Bestelldatum:</strong> {new Date(order.created_at).toLocaleDateString('de-DE')}
            </Text>
          </div>

          <Hr style={{ 
            border: 'none', 
            borderTop: '1px solid #e5e7eb',
            margin: '25px 0'
          }}/>

          {/* Lieferadresse */}
          <Text style={{ 
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#111827',
            margin: '0 0 15px 0'
          }}>
            📦 Lieferadresse
          </Text>
          
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '25px'
          }}>
            <Text style={{ 
              fontSize: '15px',
              color: '#4b5563',
              margin: '0',
              lineHeight: '24px'
            }}>
              {shippingAddress.first_name} {shippingAddress.last_name}<br/>
              {shippingAddress.address_1}<br/>
              {shippingAddress.postal_code} {shippingAddress.city}<br/>
              {shippingAddress.province ? `${shippingAddress.province}, ` : ''}{shippingAddress.country_code}
            </Text>
          </div>

          <Hr style={{ 
            border: 'none', 
            borderTop: '1px solid #e5e7eb',
            margin: '25px 0'
          }}/>

          {/* Bestellte Artikel */}
          <Text style={{ 
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#111827',
            margin: '0 0 20px 0'
          }}>
            🛒 Ihre Artikel
          </Text>

          {/* Artikel Tabelle Header */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '12px 20px',
            borderRadius: '8px 8px 0 0',
            borderBottom: '2px solid #e5e7eb'
          }}>
            <div style={{ display: 'table', width: '100%' }}>
              <div style={{ display: 'table-row' }}>
                <Text style={{ 
                  display: 'table-cell',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  width: '50%'
                }}>
                  Artikel
                </Text>
                <Text style={{ 
                  display: 'table-cell',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textAlign: 'center',
                  width: '20%'
                }}>
                  Menge
                </Text>
                <Text style={{ 
                  display: 'table-cell',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textAlign: 'right',
                  width: '30%'
                }}>
                  Preis
                </Text>
              </div>
            </div>
          </div>

          {/* Artikel Items */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            marginBottom: '25px'
          }}>
            {order.items.map((item, index) => (
              <div key={item.id} style={{
                display: 'table',
                width: '100%',
                padding: '15px 20px',
                borderBottom: index < order.items.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}>
                <div style={{ display: 'table-row' }}>
                  <div style={{ display: 'table-cell', width: '50%', verticalAlign: 'top' }}>
                    <Text style={{ 
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 4px 0'
                    }}>
                      {item.product_title}
                    </Text>
                    {item.title !== item.product_title && (
                      <Text style={{ 
                        fontSize: '13px',
                        color: '#6b7280',
                        margin: '0'
                      }}>
                        {item.title}
                      </Text>
                    )}
                  </div>
                  <Text style={{ 
                    display: 'table-cell',
                    fontSize: '15px',
                    color: '#4b5563',
                    textAlign: 'center',
                    width: '20%',
                    verticalAlign: 'top'
                  }}>
                    {item.quantity}
                  </Text>
                  <Text style={{ 
                    display: 'table-cell',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#111827',
                    textAlign: 'right',
                    width: '30%',
                    verticalAlign: 'top'
                  }}>
                    {order.currency_code === 'EUR' ? `${(item.unit_price * item.quantity).toFixed(2)} €` : `${order.currency_code} ${(item.unit_price * item.quantity).toFixed(2)}`}
                  </Text>
                </div>
              </div>
            ))}
          </div>

          {/* Gesamtsumme */}
          <div style={{
            backgroundColor: '#10b981',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'table', width: '100%' }}>
              <div style={{ display: 'table-row' }}>
                <Text style={{ 
                  display: 'table-cell',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  width: '50%'
                }}>
                  Gesamtbetrag
                </Text>
                <Text style={{ 
                  display: 'table-cell',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: 'right',
                  width: '50%'
                }}>
                  {order.currency_code === 'EUR' ? `${order.summary.raw_current_order_total.value.toFixed(2)} €` : `${order.currency_code} ${order.summary.raw_current_order_total.value.toFixed(2)}`}
                </Text>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a
              href="#"
              style={{
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                padding: '14px 32px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                display: 'inline-block'
              }}
            >
              Bestellung verfolgen
            </a>
          </div>

          {/* Footer */}
          <Hr style={{ 
            border: 'none', 
            borderTop: '1px solid #e5e7eb',
            margin: '30px 0 20px 0'
          }}/>
          
          <Text style={{ 
            fontSize: '13px',
            color: '#6b7280',
            textAlign: 'center',
            margin: '0 0 10px 0',
            lineHeight: '20px'
          }}>
            Haben Sie Fragen zu Ihrer Bestellung?<br/>
            Kontaktieren Sie uns unter: support@example.com
          </Text>

          <Text style={{ 
            fontSize: '12px',
            color: '#9ca3af',
            textAlign: 'center',
            margin: '20px 0 0 0'
          }}>
            © 2025 Ihr Unternehmen. Alle Rechte vorbehalten.
          </Text>
        </Section>
      </Section>
    </Base>
  )
}

OrderPlacedTemplate.PreviewProps = {
  order: {
    id: 'test-order-id',
    display_id: 'ORD-123456',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
    currency_code: 'EUR',
    items: [
      { id: 'item-1', title: 'Größe L', product_title: 'Premium T-Shirt', quantity: 2, unit_price: 29.99 },
      { id: 'item-2', title: 'Schwarz', product_title: 'Designer Jeans', quantity: 1, unit_price: 89.99 }
    ],
    shipping_address: {
      first_name: 'Max',
      last_name: 'Mustermann',
      address_1: 'Musterstraße 123',
      city: 'Berlin',
      province: 'Berlin',
      postal_code: '10115',
      country_code: 'DE'
    },
    summary: { raw_current_order_total: { value: 149.97 } }
  },
  shippingAddress: {
    first_name: 'Max',
    last_name: 'Mustermann',
    address_1: 'Musterstraße 123',
    city: 'Berlin',
    province: 'Berlin',
    postal_code: '10115',
    country_code: 'DE'
  }
} as OrderPlacedPreviewProps

export default OrderPlacedTemplate