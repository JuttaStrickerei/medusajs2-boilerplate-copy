// DEAKTIVIERT - Logik wurde in API Route verschoben
// Der Event-Bus ist asynchron und wartet nicht auf den Subscriber,
// daher wurde die Logik direkt in src/api/store/newsletter/route.ts implementiert

import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

// Leerer Handler um Fehler zu vermeiden
export default async function newsletterSignupHandler({
  event: { data },
  container,
}: SubscriberArgs<{ email: string; first_name?: string; last_name?: string }>) {
  const logger = container.resolve("logger")
  logger.debug(`[Newsletter Subscriber] DEAKTIVIERT - Logik in API Route verschoben`)
  // Keine Aktion - Logik ist jetzt in der API Route
}

export const config: SubscriberConfig = {
  event: "newsletter.signup",
}

