# Subscribers and Events

Subscribers are asynchronous functions that execute when specific events are emitted. Use them to perform actions after commerce operations.

## Contents
- [When to Use Subscribers](#when-to-use-subscribers)
- [Creating a Subscriber](#creating-a-subscriber)
- [Common Commerce Events](#common-commerce-events)
- [Accessing Event Data](#accessing-event-data)
- [Triggering Custom Events](#triggering-custom-events)
- [Best Practices](#best-practices)

## When to Use Subscribers

Use subscribers when you need to **react to events**:

- ✅ Send confirmation emails when orders are placed
- ✅ Sync data to external systems when products are updated
- ✅ Trigger webhooks when entities change
- ✅ Update analytics when customers are created
- ✅ Perform non-blocking side effects

**Don't use subscribers for:**
- ❌ Periodic tasks (use scheduled jobs instead)
- ❌ Operations that must block the main flow (use workflows instead)

**Subscribers vs Scheduled Jobs:**
- **Subscriber**: Reacts to `order.placed` event and sends confirmation email (event-driven)
- **Scheduled Job**: Finds abandoned carts every 6 hours and sends emails (polling pattern)

## Creating a Subscriber

Create a TypeScript file in the `src/subscribers/` directory:

```typescript
// src/subscribers/order-placed.ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function orderPlacedHandler({
  event: { eventName, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  logger.info(`Order ${data.id} was placed`)

  // Resolve services
  const orderService = container.resolve("order")
  const notificationService = container.resolve("notification")

  // Retrieve full order data
  const order = await orderService.retrieveOrder(data.id, {
    relations: ["customer", "items"],
  })

  // Send confirmation email
  await notificationService.createNotifications({
    to: order.customer.email,
    template: "order-confirmation",
    channel: "email",
    data: { order },
  })

  logger.info(`Confirmation email sent for order ${data.id}`)
}

export const config: SubscriberConfig = {
  event: "order.placed", // Single event
}
```

### Listening to Multiple Events

```typescript
export default async function productChangesHandler({
  event: { eventName, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  logger.info(`Product event: ${eventName} for product ${data.id}`)

  switch (eventName) {
    case "product.created":
      // Handle product creation
      break
    case "product.updated":
      // Handle product update
      break
    case "product.deleted":
      // Handle product deletion
      break
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
```

## Common Commerce Events

**⚠️ IMPORTANT**: Event data typically contains only the ID of the affected entity. You must retrieve the full data if needed.

### Order Events

```typescript
"order.placed" // Order was placed
"order.updated" // Order was updated
"order.canceled" // Order was canceled
"order.completed" // Order was completed
"order.shipment_created" // Shipment was created for order
```

### Product Events

```typescript
"product.created" // Product was created
"product.updated" // Product was updated
"product.deleted" // Product was deleted
```

### Customer Events

```typescript
"customer.created" // Customer was created
"customer.updated" // Customer was updated
```

### Cart Events

```typescript
"cart.created" // Cart was created
"cart.updated" // Cart was updated
```

## Accessing Event Data

### Event Data Structure

```typescript
interface SubscriberArgs<T> {
  event: {
    eventName: string // e.g., "order.placed"
    data: T // Event payload (usually contains { id: string })
  }
  container: MedusaContainer // DI container
}
```

### Retrieving Full Entity Data

**⚠️ IMPORTANT**: The `data` object typically only contains the entity ID. Retrieve the full entity data using services or query:

```typescript
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  // data.id contains the order ID
  logger.info(`Handling order.placed event for order: ${data.id}`)

  // Retrieve full order data with relations
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "email",
      "total",
      "customer.*",
      "items.*",
      "items.product.*",
    ],
    filters: {
      id: data.id,
    },
  })

  const order = orders[0]

  // Now you have the full order data
  logger.info(`Order total: ${order.total}`)
  logger.info(`Customer email: ${order.customer.email}`)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
```

## Triggering Custom Events

Emit custom events from workflows using the `emitEventStep`:

```typescript
// src/workflows/create-review.ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

const createReviewWorkflow = createWorkflow(
  "create-review",
  function (input: { product_id: string; rating: number }) {
    // Create review step
    const review = createReviewStep(input)

    // Emit custom event
    emitEventStep({
      eventName: "review.created",
      data: {
        id: review.id,
        product_id: input.product_id,
        rating: input.rating,
      },
    })

    return new WorkflowResponse({ review })
  }
)

export default createReviewWorkflow
```

Then create a subscriber for the custom event:

```typescript
// src/subscribers/review-created.ts
export default async function reviewCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; product_id: string; rating: number }>) {
  const logger = container.resolve("logger")

  logger.info(`Review ${data.id} created for product ${data.product_id}`)

  // If rating is low, notify support
  if (data.rating <= 2) {
    const notificationService = container.resolve("notification")
    await notificationService.createNotifications({
      to: "support@example.com",
      template: "low-rating-alert",
      channel: "email",
      data: {
        review_id: data.id,
        product_id: data.product_id,
        rating: data.rating,
      },
    })
  }
}

export const config: SubscriberConfig = {
  event: "review.created",
}
```

## Best Practices

### 1. Always Use Logging

```typescript
export default async function mySubscriber({
  event: { eventName, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  logger.info(`Handling ${eventName} for ${data.id}`)

  try {
    // Subscriber logic
    logger.info(`Successfully handled ${eventName}`)
  } catch (error) {
    logger.error(`Failed to handle ${eventName}: ${error.message}`)
  }
}
```

### 2. Handle Errors Gracefully

Subscribers run asynchronously and don't block the main flow. Log errors but don't throw:

```typescript
// ✅ GOOD: Catches errors and logs
export default async function mySubscriber({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  try {
    await sendEmail(data.id)
  } catch (error) {
    logger.error(`Failed to send email: ${error.message}`)
    // Don't throw - subscriber completes gracefully
  }
}
```

### 3. Keep Subscribers Fast and Non-Blocking

Subscribers should perform quick operations. For long-running tasks, consider queuing.

### 4. Use Workflows for Mutations

If your subscriber needs to perform mutations, use workflows:

```typescript
import { syncProductWorkflow } from "../workflows/sync-product"

export default async function productCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  try {
    await syncProductWorkflow(container).run({
      input: { product_id: data.id },
    })
    logger.info(`Product ${data.id} synced successfully`)
  } catch (error) {
    logger.error(`Failed to sync product ${data.id}: ${error.message}`)
  }
}
```

### 5. Avoid Infinite Event Loops

Be careful when subscribing to events that trigger more events:

```typescript
// ✅ GOOD: Add guard condition
export default async function productUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")

  // Retrieve product to check if we should update
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "metadata"],
    filters: { id: data.id },
  })

  const product = products[0]

  // Guard: Only update if not already processed
  if (!product.metadata?.processed) {
    const productService = container.resolve("product")
    await productService.updateProducts({
      id: data.id,
      metadata: { processed: true },
    })
  }
}
```

### 6. Make Subscribers Idempotent

Subscribers might be called multiple times for the same event. Design them to handle this:

```typescript
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const myService = container.resolve("my-service")

  // Check if we've already processed this order
  const processed = await myService.isOrderProcessed(data.id)

  if (processed) {
    logger.info(`Order ${data.id} already processed, skipping`)
    return
  }

  // Process order
  await myService.processOrder(data.id)

  // Mark as processed
  await myService.markOrderAsProcessed(data.id)
}
```
