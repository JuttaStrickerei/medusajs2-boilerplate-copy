import { ReactNode } from 'react'
import { MedusaError } from '@medusajs/framework/utils'
import { InviteUserEmail, INVITE_USER, isInviteUserData } from './invite-user'
import { OrderPlacedTemplate, ORDER_PLACED, isOrderPlacedTemplateData } from './order-placed'
import { ShipmentSentTemplate, SHIPMENT_SENT, isShipmentSentTemplateData } from './shipment-sent'
import { ShipmentDeliveredTemplate, SHIPMENT_DELIVERED, isShipmentDeliveredTemplateData } from './shipment-delivered'
import { ContactFormTemplate, CONTACT_FORM, isContactFormTemplateData } from './contact-form'
import { ContactFormConfirmationTemplate, CONTACT_FORM_CONFIRMATION, isContactFormConfirmationTemplateData } from './contact-form-confirmation'
import { NewsletterConfirmationTemplate, NEWSLETTER_CONFIRMATION, isNewsletterConfirmationTemplateData } from './newsletter-confirmation'

export const EmailTemplates = {
  INVITE_USER,
  ORDER_PLACED,
  SHIPMENT_SENT,
  SHIPMENT_DELIVERED,
  CONTACT_FORM,
  CONTACT_FORM_CONFIRMATION,
  NEWSLETTER_CONFIRMATION
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

    case EmailTemplates.CONTACT_FORM:
      if (!isContactFormTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.CONTACT_FORM}"`
        )
      }
      return <ContactFormTemplate {...data} />

    case EmailTemplates.CONTACT_FORM_CONFIRMATION:
      if (!isContactFormConfirmationTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.CONTACT_FORM_CONFIRMATION}"`
        )
      }
      return <ContactFormConfirmationTemplate {...data} />

    case EmailTemplates.NEWSLETTER_CONFIRMATION:
      if (!isNewsletterConfirmationTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.NEWSLETTER_CONFIRMATION}"`
        )
      }
      return <NewsletterConfirmationTemplate {...data} />

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
  ShipmentDeliveredTemplate,
  ContactFormTemplate,
  ContactFormConfirmationTemplate,
  NewsletterConfirmationTemplate
}