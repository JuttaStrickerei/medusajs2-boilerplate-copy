import { 
  AbstractNotificationProviderService, 
  MedusaError,
} from "@medusajs/framework/utils"
import { 
  ProviderSendNotificationResultsDTO, 
  ProviderSendNotificationDTO,
  Logger,
} from "@medusajs/framework/types"
import mailchimpMarketingApi from "@mailchimp/mailchimp_marketing"
import { createHash } from "crypto"

type Options = {
  apiKey: string
  server: string
  listId: string
  templates?: {
    new_products?: {
      subject_line?: string
      storefront_url?: string
    }
  }
}

type InjectedDependencies = {
  logger: Logger
}

// Markierung (Tag) in Mailchimp für Anmeldungen aus dem Online-Shop. Die Website
// markiert ihre Anmeldungen in derselben Liste mit "homepage"; so bleiben beide Wege
// unterscheidbar (Segmente, spätere Abläufe). Mailchimp legt den Tag beim ersten Mal an.
const SHOP_SIGNUP_TAG = "Online Shop"

// Antworten an die Newsletter-Route (api/store/newsletter), wenn die Adresse schon in der
// Liste steht. NOT_SUBSCRIBED trägt nach einem Leerzeichen den Link zum Anmeldeformular.
const ALREADY_SUBSCRIBED = "ALREADY_SUBSCRIBED"
const NOT_SUBSCRIBED = "NOT_SUBSCRIBED"

class MailchimpNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "mailchimp"
  protected options: Options
  protected mailchimp: typeof mailchimpMarketingApi
  protected logger_: Logger
  // Link zum Anmeldeformular der Liste, einmal nachgeschlagen
  protected signupFormUrl_: string | null = null

  constructor(container: InjectedDependencies, options: Options) {
    super()
    this.options = options
    this.logger_ = container.logger
    this.mailchimp = mailchimpMarketingApi
    this.mailchimp.setConfig({
      apiKey: options.apiKey,
      server: options.server,
    })
    
    // Debug: Log configuration on initialization
    this.logger_.info(`[Mailchimp] Provider initialized - hasApiKey: ${!!options.apiKey}, hasServer: ${!!options.server}, hasListId: ${!!options.listId}, server: ${options.server}, listId: ${options.listId ? `${options.listId.substring(0, 8)}...` : 'missing'}`)
  }

  static validateOptions(options: Record<any, any>): void | never {
    if (!options.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT, 
        "API key is required"
      )
    }
    if (!options.server) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT, 
        "Server is required"
      )
    }
    if (!options.listId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT, 
        "List ID is required"
      )
    }
  }

  async sendNewsletterSignup(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { to, data } = notification

    // Debug: Log incoming notification (without PII)
    this.logger_.debug(`[Mailchimp] sendNewsletterSignup called - hasApiKey: ${!!this.options.apiKey}, hasServer: ${!!this.options.server}, hasListId: ${!!this.options.listId}`)

    try {
      this.logger_.debug(`[Mailchimp] Calling Mailchimp API to add list member`)

      const response = await this.mailchimp.lists.addListMember(
        this.options.listId, {
          email_address: to,
          status: "subscribed",
          merge_fields: {
            FNAME: data?.first_name,
            LNAME: data?.last_name,
          },
          tags: [SHOP_SIGNUP_TAG],
        }
      )

      // Debug: Log successful response (without PII)
      const status = response.status || "unknown"
      this.logger_.info(`[Mailchimp] Successfully added new subscriber, status: ${status}`)
  
      return {
        id: "id" in response ? response.id : "",
      }
    } catch (error: any) {
      const errorBody = error.response?.body || {}
      const errorTitle = errorBody.title || ""
      const errorDetail = errorBody.detail || error.message || ""
      const errorStatus = error.response?.status

      this.logger_.debug(`[Mailchimp] API error: title=${errorTitle}, status=${errorStatus}`)

      // "Member Exists" Fehler - E-Mail ist bereits in der Liste. "Member In Compliance State":
      // Die Adresse ist dort abgemeldet oder unzustellbar und lässt sich so nicht anmelden.
      // Der Eintrag bleibt in beiden Fällen unverändert (kein Name, kein Tag, kein Status).
      if (
        errorTitle === "Member Exists" ||
        errorTitle === "Member In Compliance State" ||
        (errorStatus === 400 && errorDetail.includes("already a list member"))
      ) {
        this.logger_.debug(`[Mailchimp] Email already in the list - checking its status`)
        return this.existingMemberResult(to, errorTitle === "Member In Compliance State")
      }

      // "Invalid Resource" Fehler - Ungültige E-Mail-Adresse
      if (errorTitle === "Invalid Resource" || errorDetail.includes("valid email")) {
        this.logger_.warn(`[Mailchimp] Invalid email address provided`)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Bitte geben Sie eine gültige E-Mail-Adresse ein."
        )
      }

      // Andere Fehler
      this.logger_.error(`[Mailchimp] Unexpected error: ${errorTitle}`)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Newsletter-Anmeldung fehlgeschlagen: ${errorDetail}`
      )
    }
  }

  // Steht die Adresse schon in der Liste, entscheidet ihr Status: "subscribed" heißt schon
  // dabei. Abgemeldet, unzustellbar oder unbestätigt lässt sich über die Schnittstelle nicht
  // wieder anmelden; dafür gibt es das Anmeldeformular der Liste, das Mailchimp mit
  // Bestätigung führt. Ist der Status nicht lesbar, gilt das alte Verhalten (schon dabei).
  private async existingMemberResult(
    email: string,
    complianceState: boolean
  ): Promise<ProviderSendNotificationResultsDTO> {
    let status: string | undefined
    try {
      const hash = createHash("md5").update(email.trim().toLowerCase()).digest("hex")
      const member = (await this.mailchimp.lists.getListMember(this.options.listId, hash, {
        fields: ["status"],
      } as any)) as { status?: string }
      status = member?.status
    } catch {
      this.logger_.warn(`[Mailchimp] Status of an existing list member could not be read`)
    }

    if (status === "subscribed" || (status === undefined && !complianceState)) {
      return { id: ALREADY_SUBSCRIBED }
    }

    this.logger_.info(`[Mailchimp] Signup for an address that is not subscribed (status: ${status || "unknown"})`)
    const url = await this.getSignupFormUrl()
    return { id: url ? `${NOT_SUBSCRIBED} ${url}` : NOT_SUBSCRIBED }
  }

  private async getSignupFormUrl(): Promise<string | null> {
    if (this.signupFormUrl_) {
      return this.signupFormUrl_
    }
    try {
      // getList fehlt in den Typen der Bibliothek, ist dort aber vorhanden
      const list = (await (this.mailchimp.lists as any).getList(this.options.listId, {
        fields: ["subscribe_url_long"],
      })) as { subscribe_url_long?: string }
      const url = list?.subscribe_url_long
      if (typeof url === "string" && /^https:\/\/[^\s]+$/.test(url)) {
        this.signupFormUrl_ = url
        return url
      }
    } catch {
      this.logger_.warn(`[Mailchimp] Signup form link of the list could not be read`)
    }
    return null
  }

  private async getNewProductsHtmlContent(data: any): Promise<string> {
    return `
      <!DOCTYPE html>
        <html xmlns:mc="http://schemas.mailchimp.com/2006/hcm">
        <head>
          <meta charset="UTF-8">
          <title>${this.options.templates?.new_products?.subject_line}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              background: #ffffff;
              margin: 0 auto;
              padding: 20px;
            }
            .product {
              border-bottom: 1px solid #ddd;
              padding: 20px 0;
              display: flex;
            }
            .product img {
              max-width: 120px;
              margin-right: 20px;
            }
            .product-info {
              flex: 1;
            }
            .product-info h4 {
              margin: 0 0 10px;
              font-size: 18px;
            }
            .product-info p {
              margin: 0 0 5px;
              color: #555;
            }
            .cta-button {
              display: inline-block;
              margin-top: 10px;
              background-color: #007BFF;
              color: #ffffff;
              text-decoration: none;
              padding: 10px 15px;
              border-radius: 4px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 style="text-align:center;">Check out our latest products</h2>

            <!-- Repeatable product block -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" mc:repeatable="product_block" mc:variant="Product Item">
              <tbody>
                ${data.products.map((product: any) => `
                  <tr>
                    <td class="product">
                        <img mc:edit="product_image" src="${product.thumbnail}" alt="Product Image">
                        <div class="product-info">
                          <h4 mc:edit="product_title">${product.title}</h4>
                          <p mc:edit="product_description">${product.description}</p>
                          <a mc:edit="product_link" href="${this.options.templates?.new_products?.storefront_url}/products/${product.handle}" class="cta-button">View Product</a>
                        </div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

          </div>
        </body>
        </html>
    `
  }

  async sendNewProducts(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { data } = notification

    try {
      const list = await fetch(
        `https://${this.options.server}.api.mailchimp.com/3.0/lists/${this.options.listId}`, 
        {
          headers: {
            Authorization: `Bearer ${this.options.apiKey}`,
          },
        }
      ).then((res) => res.json()) as mailchimpMarketingApi.lists.List

      // create a campaign
      const campaign = await this.mailchimp.campaigns.create({
        type: "regular",
        recipients: {
          list_id: this.options.listId,
        },
        settings: {
          subject_line: 
            this.options.templates?.new_products?.subject_line || "New Products",
          from_name: list.campaign_defaults.from_name,
          reply_to: list.campaign_defaults.from_email,
        },
      }) as mailchimpMarketingApi.campaigns.Campaigns

      // set content
      await this.mailchimp.campaigns.setContent(campaign.id, {
        html: await this.getNewProductsHtmlContent(data),
      })

      // send campaign
      await this.mailchimp.campaigns.send(campaign.id)

      return {
        id: campaign.id,
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE, 
        `Failed to send new products newsletter: ${
          error.response?.text || error
        }`
      )
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { template } = notification

    // Debug: Log that send method was called
    // ohne Empfänger-Adresse: Mail-Adressen gehören nicht ins Server-Protokoll
    this.logger_.info(`[Mailchimp] send() method called - template: ${template}, channel: ${notification.channel}`)

    switch (template) {
      case "newsletter-signup":
        return this.sendNewsletterSignup(notification)
      case "new-products":
        return this.sendNewProducts(notification)
      default:
        this.logger_.error(`[Mailchimp] Invalid template: ${template}`)
        throw new MedusaError(
          MedusaError.Types.INVALID_ARGUMENT, 
          "Invalid template"
        )
    }
  }
}

export default MailchimpNotificationProviderService

