import { defineMiddlewares } from "@medusajs/framework/http"

// Medusa scans for the file name `middlewares.ts` (plural) at the top of
// src/api/. The existing `middleware.ts` (singular) in this repo is a
// pre-existing no-op that Medusa never loads; do not merge it here.
//
// This file exists solely to register the raw-body bodyParser for the
// Sendcloud webhook so `req.rawBody` is populated for HMAC verification.
export default defineMiddlewares({
  routes: [
    {
      matcher: "/webhooks/sendcloud",
      method: ["POST"],
      bodyParser: { preserveRawBody: true },
    },
  ],
})
