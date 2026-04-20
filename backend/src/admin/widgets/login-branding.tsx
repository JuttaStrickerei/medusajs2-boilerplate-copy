import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Heading, Text } from "@medusajs/ui"

const LoginBrandingWidget = () => {
  return (
    <div className="flex w-full flex-col items-center gap-y-1 py-2">
      <Heading level="h2" className="text-ui-fg-base tracking-tight">
        Strickerei Jutta
      </Heading>
      <Text size="xsmall" className="text-ui-fg-muted uppercase tracking-[0.2em]">
        in 3. Generation
      </Text>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginBrandingWidget
