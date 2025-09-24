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
} = ({ order, shippingAddress, preview = 'Your order has been placed!' }) => {
  return (
    <Base preview={preview}>
  <Section style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
    {/* Header mit Logo-Platzhalter */}
    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
      <Text style={{ 
        fontSize: '28px', 
        fontWeight: '600', 
        color: '#1a1a1a',
        margin: '0 0 8px',
        letterSpacing: '-0.5px'
      }}>
        Bestellbestätigung
      </Text>
      <Text style={{ 
        fontSize: '14px', 
        color: '#666',
        margin: 0
      }}>
        Vielen Dank für Ihre Bestellung!
      </Text>
    </div>

    {/* Persönliche Ansprache */}
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      borderRadius: '12px', 
      padding: '24px',
      marginBottom: '32px'
    }}>
      <Text style={{ 
        fontSize: '16px',
        color: '#1a1a1a',
        margin: '0 0 16px',
        lineHeight: '1.5'
      }}>
        Hallo {shippingAddress.first_name} {shippingAddress.last_name},
      </Text>
      <Text style={{ 
        fontSize: '15px',
        color: '#4a5568',
        margin: 0,
        lineHeight: '1.6'
      }}>
        wir haben Ihre Bestellung erhalten und werden diese schnellstmöglich bearbeiten. 
        Unten finden Sie alle wichtigen Details zu Ihrer Bestellung.
      </Text>
    </div>

    {/* Bestellübersicht */}
    <div style={{ marginBottom: '32px' }}>
      <Text style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        color: '#1a1a1a',
        margin: '0 0 16px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '8px'
      }}>
        Bestellübersicht
      </Text>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: '14px', color: '#718096', margin: 0 }}>
            Bestellnummer:
          </Text>
          <Text style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
            #{order.display_id}
          </Text>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: '14px', color: '#718096', margin: 0 }}>
            Bestelldatum:
          </Text>
          <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: 0 }}>
            {new Date(order.created_at).toLocaleDateString('de-DE', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '8px',
          paddingTop: '12px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
            Gesamtbetrag:
          </Text>
          <Text style={{ fontSize: '20px', fontWeight: '700', color: '#059669', margin: 0 }}>
            {order.summary.raw_current_order_total.value} {order.currency_code}
          </Text>
        </div>
      </div>
    </div>

    {/* Artikel */}
    <div style={{ marginBottom: '32px' }}>
      <Text style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        color: '#1a1a1a',
        margin: '0 0 16px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '8px'
      }}>
        Bestellte Artikel
      </Text>

      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        {/* Tabellenkopf */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          backgroundColor: '#f8f9fa',
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <Text style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', margin: 0 }}>
            ARTIKEL
          </Text>
          <Text style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', margin: 0, textAlign: 'center' }}>
            MENGE
          </Text>
          <Text style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', margin: 0, textAlign: 'right' }}>
            PREIS
          </Text>
        </div>

        {/* Artikel-Zeilen */}
        {order.items.map((item, index) => (
          <div key={item.id} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            padding: '16px',
            borderBottom: index < order.items.length - 1 ? '1px solid #f1f5f9' : 'none',
            backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc'
          }}>
            <div>
              <Text style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a', margin: '0 0 4px' }}>
                {item.product_title}
              </Text>
              {item.title !== item.product_title && (
                <Text style={{ fontSize: '13px', color: '#718096', margin: 0 }}>
                  {item.title}
                </Text>
              )}
            </div>
            <Text style={{ fontSize: '14px', color: '#4a5568', margin: 0, textAlign: 'center' }}>
              {item.quantity}
            </Text>
            <Text style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a', margin: 0, textAlign: 'right' }}>
              {item.unit_price} {order.currency_code}
            </Text>
          </div>
        ))}
      </div>
    </div>

    {/* Lieferadresse */}
    <div style={{ marginBottom: '32px' }}>
      <Text style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        color: '#1a1a1a',
        margin: '0 0 16px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '8px'
      }}>
        Lieferadresse
      </Text>
      
      <div style={{ 
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <Text style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a', margin: '0 0 8px' }}>
          {shippingAddress.first_name} {shippingAddress.last_name}
        </Text>
        <Text style={{ fontSize: '14px', color: '#4a5568', margin: '0 0 4px' }}>
          {shippingAddress.address_1}
        </Text>
        <Text style={{ fontSize: '14px', color: '#4a5568', margin: '0 0 4px' }}>
          {shippingAddress.postal_code} {shippingAddress.city}
        </Text>
        <Text style={{ fontSize: '14px', color: '#4a5568', margin: 0 }}>
          {shippingAddress.province ? `${shippingAddress.province}, ` : ''}{shippingAddress.country_code}
        </Text>
      </div>
    </div>

    {/* Footer */}
    <Hr style={{ borderColor: '#e2e8f0', margin: '40px 0 24px' }} />
    
    <div style={{ textAlign: 'center' }}>
      <Text style={{ fontSize: '13px', color: '#718096', margin: '0 0 8px', lineHeight: '1.6' }}>
        Bei Fragen zu Ihrer Bestellung kontaktieren Sie uns gerne unter support@example.com
      </Text>
      <Text style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>
        Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese Nachricht.
      </Text>
    </div>
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
