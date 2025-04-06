import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { OrderDTO, OrderAddressDTO, FulfillmentDTO } from '@medusajs/framework/types'

export const SHIPMENT_SENT = 'shipment-sent'

interface ShipmentSentPreviewProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  fulfillment: FulfillmentDTO
  shippingAddress: OrderAddressDTO
}

export interface ShipmentSentTemplateProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  fulfillment: FulfillmentDTO
  shippingAddress: OrderAddressDTO
  preview?: string
}

export const isShipmentSentTemplateData = (data: any): data is ShipmentSentTemplateProps =>
  typeof data.order === 'object' && typeof data.fulfillment === 'object' && typeof data.shippingAddress === 'object'

export const ShipmentSentTemplate: React.FC<ShipmentSentTemplateProps> & {
  PreviewProps: ShipmentSentPreviewProps
} = ({ order, fulfillment, shippingAddress, preview = 'Your order has been shipped!' }) => {
  return (
    <Base preview={preview}>
      <Section>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', margin: '0 0 30px' }}>
          Order Shipment Notification
        </Text>

        <Text style={{ margin: '0 0 15px' }}>
          Dear {shippingAddress.first_name} {shippingAddress.last_name},
        </Text>

        <Text style={{ margin: '0 0 30px' }}>
          Great news! Your order has been shipped and is on its way to you.
        </Text>

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>
          Order Summary
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          Order ID: {order.display_id}
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          Order Date: {new Date(order.created_at).toLocaleDateString()}
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          Shipment Date: {new Date(fulfillment.created_at).toLocaleDateString()}
        </Text>
        

        <Hr style={{ margin: '20px 0' }} />

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>
          Shipping Address
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          {shippingAddress.address_1}
        </Text>
        {shippingAddress.address_2 && (
          <Text style={{ margin: '0 0 5px' }}>
            {shippingAddress.address_2}
          </Text>
        )}
        <Text style={{ margin: '0 0 5px' }}>
          {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}
        </Text>
        <Text style={{ margin: '0 0 20px' }}>
          {shippingAddress.country_code}
        </Text>

        <Hr style={{ margin: '20px 0' }} />

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px' }}>
          Shipped Items
        </Text>

        <div style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #ddd',
          margin: '10px 0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#f2f2f2',
            padding: '8px',
            borderBottom: '1px solid #ddd'
          }}>
            <Text style={{ fontWeight: 'bold' }}>Item</Text>
            <Text style={{ fontWeight: 'bold' }}>Quantity</Text>
            <Text style={{ fontWeight: 'bold' }}>Price</Text>
          </div>
          
        </div>

        <Hr style={{ margin: '20px 0' }} />

        <Text style={{ margin: '0 0 15px' }}>
          Thank you for shopping with us! If you have any questions about your shipment, please contact our customer service.
        </Text>
      </Section>
    </Base>
  )
}

// Define properly typed preview props
ShipmentSentTemplate.PreviewProps = {
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
  } as ShipmentSentPreviewProps

export default ShipmentSentTemplate