import { ReactNode } from 'react'
import { MedusaError } from '@medusajs/framework/utils'
import { InviteUserEmail, INVITE_USER, isInviteUserData } from './invite-user'
import { OrderPlacedTemplate, ORDER_PLACED, isOrderPlacedTemplateData } from './order-placed'
import { ShipmentSentTemplate, SHIPMENT_SENT, isShipmentSentTemplateData } from './shipment-sent'
import { ShipmentDeliveredTemplate, SHIPMENT_DELIVERED, isShipmentDeliveredTemplateData } from './shipment-delivered'

export const EmailTemplates = {
  INVITE_USER,
  ORDER_PLACED,
  SHIPMENT_SENT,
  SHIPMENT_DELIVERED
} as const

export type EmailTemplateType = keyof typeof EmailTemplates

export function generateEmailTemplate(templateKey: string, data: unknown): ReactNode {
  switch (templateKey) {
    case EmailTemplates.INVITE_USER:
      if (!isInviteUserData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.INVITE_USER}"`
        )
      }
      return <InviteUserEmail {...data} />

    case EmailTemplates.ORDER_PLACED:
      if (!isOrderPlacedTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.ORDER_PLACED}"`
        )
      }
      return <OrderPlacedTemplate {...data} />
      
    case EmailTemplates.SHIPMENT_SENT:
      if (!isShipmentSentTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.SHIPMENT_SENT}"`
        )
      }
      return <ShipmentSentTemplate {...data} />
      
    case EmailTemplates.SHIPMENT_DELIVERED:
      if (!isShipmentDeliveredTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.SHIPMENT_DELIVERED}"`
        )
      }
      return <ShipmentDeliveredTemplate {...data} />

    default:
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unknown template key: "${templateKey}"`
      )
  }
}

export { 
  InviteUserEmail, 
  OrderPlacedTemplate, 
  ShipmentSentTemplate, 
  ShipmentDeliveredTemplate 
}