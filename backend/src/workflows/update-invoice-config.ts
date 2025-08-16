import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateInvoiceConfigStep } from "./steps/update-invoice-config"
// Add this import for your entity type
import { InvoiceConfig } from "../modules/invoice_generator/models/invoice_config"

type WorkflowInput = {
  id?: string
  company_name?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  company_logo?: string
  notes?: string
}

export const updateInvoiceConfigWorkflow = createWorkflow(
  "update-invoice-config",

  (input: WorkflowInput): WorkflowResponse<{ invoice_config: typeof InvoiceConfig }> => {
    const invoiceConfig = updateInvoiceConfigStep(input)

    return new WorkflowResponse({
      invoice_config: invoiceConfig,
    })
  }
)