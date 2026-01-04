import { ModuleProviderExports } from '@medusajs/framework/types'
import MailchimpNotificationProviderService from "./service"

const services = [MailchimpNotificationProviderService]

const providerExport: ModuleProviderExports = {
  services,
}

export default providerExport

