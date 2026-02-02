# Authentication in Medusa

Authentication in Medusa secures API routes and ensures only authorized users can access protected resources.

## Contents
- [Default Protected Routes](#default-protected-routes)
- [Authentication Methods](#authentication-methods)
- [Custom Protected Routes](#custom-protected-routes)
- [Accessing Authenticated User](#accessing-authenticated-user)
- [Authentication Patterns](#authentication-patterns)

## Default Protected Routes

Medusa automatically protects certain route prefixes:

### Admin Routes (`/admin/*`)
- **Who can access**: Authenticated admin users only
- **Authentication methods**: Session, Bearer token, API key

### Customer Routes (`/store/customers/me/*`)
- **Who can access**: Authenticated customers only
- **Authentication methods**: Session, Bearer token

**These routes require no additional configuration** - authentication is handled automatically by Medusa.

## Authentication Methods

### Session Authentication
- Used after login via email/password
- Cookie-based session management

### Bearer Token (JWT)
- Token-based authentication
- Passed in `Authorization: Bearer <token>` header

### API Key
- Admin-only authentication method
- Used for server-to-server communication
- Passed in `x-medusa-access-token` header

## Custom Protected Routes

**⚠️ CRITICAL: Only add `authenticate` middleware to routes OUTSIDE the default prefixes.**

Routes with these prefixes are automatically authenticated - **do NOT add middleware:**
- `/admin/*` - Already requires authenticated admin user
- `/store/customers/me/*` - Already requires authenticated customer

```typescript
// ✅ CORRECT - Custom route needs authenticate middleware
export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/reviews*", // Not a default protected prefix
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})

// ❌ WRONG - /admin routes are automatically authenticated
export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/reports*", // Already protected!
      middlewares: [authenticate("user", ["session", "bearer"])], // Redundant!
    },
  ],
})
```

### Protecting Custom Admin Routes

```typescript
// api/middlewares.ts
import { defineMiddlewares, authenticate } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/custom/admin*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
  ],
})
```

**Parameters:**
- First parameter: `"user"` for admin users, `"customer"` for customers
- Second parameter: Array of allowed authentication methods

### Protecting Custom Customer Routes

```typescript
export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/reviews*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})
```

## Accessing Authenticated User

**⚠️ CRITICAL - Type Safety**: For protected routes, you MUST use `AuthenticatedMedusaRequest` instead of `MedusaRequest`.

**⚠️ CRITICAL - Manual Validation**: Do NOT manually validate authentication when using the `authenticate` middleware.

### ✅ CORRECT - Using AuthenticatedMedusaRequest

```typescript
// api/store/reviews/[id]/route.ts
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteReviewWorkflow } from "../../../../workflows/delete-review"

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  // ✅ CORRECT: Just use req.auth_context.actor_id directly
  const customerId = req.auth_context.actor_id

  // Pass to workflow - let the workflow handle business logic validation
  const { result } = await deleteReviewWorkflow(req.scope).run({
    input: {
      reviewId: id,
      customerId,
    },
  })

  return res.json({ success: true })
}
```

### ❌ WRONG - Using MedusaRequest for Protected Routes

```typescript
export async function DELETE(
  req: MedusaRequest, // ❌ WRONG: Should use AuthenticatedMedusaRequest
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id // ❌ Type error!
}
```

### ❌ WRONG - Manual Authentication Check

```typescript
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  // ❌ WRONG: Don't manually check if user is authenticated
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be authenticated"
    )
  }
  // The authenticate middleware already did this!
}
```

## Authentication Patterns

### Pattern: User-Specific Data

```typescript
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const userId = req.auth_context.actor_id
  const query = req.scope.resolve("query")

  // Get reports created by this admin user
  const { data: reports } = await query.graph({
    entity: "report",
    fields: ["id", "title", "created_at"],
    filters: {
      created_by: userId,
    },
  })

  return res.json({ reports })
}
```

### Pattern: Ownership Validation

**⚠️ IMPORTANT**: Ownership validation should be done in workflow steps, not API routes.

```typescript
// ✅ CORRECT - Pass user ID to workflow, let workflow validate ownership
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context.actor_id
  const { id } = req.params

  // Pass to workflow - workflow will validate ownership
  const { result } = await deleteReviewWorkflow(req.scope).run({
    input: {
      reviewId: id,
      customerId, // Workflow validates this review belongs to this customer
    },
  })

  return res.json({ success: true })
}
```

### Pattern: Optional Authentication

Some routes may benefit from authentication but don't require it:

```typescript
export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/products/*/reviews",
      middlewares: [
        authenticate("customer", ["session", "bearer"], {
          allowUnauthenticated: true, // Allows access without authentication
        })
      ],
    },
  ],
})
```

```typescript
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id // May be undefined

  // If authenticated, mark customer's own reviews
  if (customerId) {
    reviews.forEach(review => {
      review.is_own = review.customer_id === customerId
    })
  }

  return res.json({ reviews })
}
```

## Security Best Practices

### 1. Use Actor ID from Context

```typescript
// ✅ GOOD: Uses authenticated context
const customerId = req.auth_context.actor_id

// ❌ BAD: Takes user ID from request
const { customer_id } = req.validatedBody // ❌ Can be spoofed
```

### 2. Appropriate Authentication Methods

```typescript
// ✅ GOOD: Admin routes support all methods
authenticate("user", ["session", "bearer", "api-key"])

// ✅ GOOD: Customer routes use session/bearer only
authenticate("customer", ["session", "bearer"])

// ❌ BAD: Customer routes with API key
authenticate("customer", ["api-key"]) // API keys are for admin only
```

### 3. Don't Expose Sensitive Data

```typescript
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customer = await getCustomer(customerId)

  // Remove sensitive data before sending
  delete customer.password_hash
  delete customer.metadata?.internal_notes

  return res.json({ customer })
}
```
