# Scheduled Jobs

Scheduled jobs are asynchronous functions that run automatically at specified intervals during the Medusa application's runtime.

## Contents
- [When to Use Scheduled Jobs](#when-to-use-scheduled-jobs)
- [Creating a Scheduled Job](#creating-a-scheduled-job)
- [Configuration Options](#configuration-options)
- [Executing Workflows in Scheduled Jobs](#executing-workflows-in-scheduled-jobs)
- [Cron Expression Examples](#cron-expression-examples)
- [Best Practices](#best-practices)

## When to Use Scheduled Jobs

Use scheduled jobs when you need to perform actions **periodically**:

- ✅ Syncing data with third-party services on a schedule
- ✅ Sending periodic reports (daily, weekly)
- ✅ Cleaning up stale data (expired carts, old sessions)
- ✅ Generating batch exports
- ✅ Recalculating aggregated data

**Don't use scheduled jobs for:**
- ❌ Reacting to events (use subscribers instead)
- ❌ One-time tasks (use workflows directly)
- ❌ Real-time processing (use API routes + workflows)

## Creating a Scheduled Job

Create a TypeScript file in the `src/jobs/` directory:

```typescript
// src/jobs/sync-products.ts
import { MedusaContainer } from "@medusajs/framework/types"

export default async function syncProductsJob(container: MedusaContainer) {
  const logger = container.resolve("logger")

  logger.info("Starting product sync...")

  try {
    // Resolve services from container
    const productService = container.resolve("product")
    const myService = container.resolve("my-custom-service")

    const products = await productService.listProducts({ active: true })

    for (const product of products) {
      await myService.syncToExternalSystem(product)
    }

    logger.info("Product sync completed successfully")
  } catch (error) {
    logger.error(`Product sync failed: ${error.message}`)
  }
}

export const config = {
  name: "sync-products-daily", // Unique name for the job
  schedule: "0 0 * * *", // Cron expression: midnight daily
}
```

## Configuration Options

```typescript
export const config = {
  name: "my-job", // Required: unique identifier
  schedule: "* * * * *", // Required: cron expression
  numberOfExecutions: 3, // Optional: limit total scheduled executions
}
```

### Configuration Properties

- **name** (required): Unique identifier for the job
- **schedule** (required): Cron expression defining when to run
- **numberOfExecutions** (optional): Maximum number of times to execute the job

**⚠️ CRITICAL - Understanding numberOfExecutions:**

`numberOfExecutions` limits how many times the job runs **on its schedule**, NOT immediately on server start.

```typescript
// ❌ WRONG UNDERSTANDING: This will NOT run immediately on server start
export const config = {
  name: "test-job",
  schedule: "0 0 * * *", // Daily at midnight
  numberOfExecutions: 1, // Will run ONCE at the next midnight, not now!
}

// ✅ CORRECT: To test a job immediately, use a frequent schedule
export const config = {
  name: "test-job",
  schedule: "* * * * *", // Every minute
  numberOfExecutions: 1, // Will run once at the next minute
}
```

## Executing Workflows in Scheduled Jobs

**⚠️ BEST PRACTICE**: Use workflows for mutations in scheduled jobs.

```typescript
// src/jobs/send-weekly-newsletter.ts
import { MedusaContainer } from "@medusajs/framework/types"
import { sendNewsletterWorkflow } from "../workflows/send-newsletter"

export default async function sendNewsletterJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  logger.info("Sending weekly newsletter...")

  try {
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "email"],
      filters: {
        newsletter_subscribed: true,
      },
    })

    logger.info(`Found ${customers.length} subscribers`)

    await sendNewsletterWorkflow(container).run({
      input: {
        customer_ids: customers.map((c) => c.id),
      },
    })

    logger.info("Newsletter sent successfully")
  } catch (error) {
    logger.error(`Newsletter job failed: ${error.message}`)
  }
}

export const config = {
  name: "send-weekly-newsletter",
  schedule: "0 0 * * 0", // Every Sunday at midnight
}
```

## Cron Expression Examples

Cron format: `minute hour day-of-month month day-of-week`

```typescript
// Every minute
schedule: "* * * * *"

// Every 5 minutes
schedule: "*/5 * * * *"

// Every hour at minute 0
schedule: "0 * * * *"

// Every day at midnight (00:00)
schedule: "0 0 * * *"

// Every day at 2:30 AM
schedule: "30 2 * * *"

// Every Sunday at midnight
schedule: "0 0 * * 0"

// Every Monday at 9 AM
schedule: "0 9 * * 1"

// First day of every month at midnight
schedule: "0 0 1 * *"

// Every weekday (Mon-Fri) at 6 PM
schedule: "0 18 * * 1-5"

// Every 6 hours
schedule: "0 */6 * * *"
```

**Tip**: Use [crontab.guru](https://crontab.guru) to build and validate cron expressions.

## Best Practices

### 1. Always Use Logging

```typescript
export default async function myJob(container: MedusaContainer) {
  const logger = container.resolve("logger")

  logger.info("Job started")

  try {
    // Job logic
    logger.info("Job completed successfully")
  } catch (error) {
    logger.error(`Job failed: ${error.message}`, { error })
  }
}
```

### 2. Handle Errors Gracefully

Don't throw errors at the top level - log them and let the job complete:

```typescript
// ✅ GOOD: Catches errors and logs
export default async function myJob(container: MedusaContainer) {
  const logger = container.resolve("logger")

  try {
    const service = container.resolve("my-service")
    const items = await service.getItems()
    // Process items
  } catch (error) {
    logger.error(`Job failed: ${error.message}`)
    // Job completes, will retry on next schedule
  }
}
```

### 3. Make Jobs Idempotent

Design jobs to be safely re-runnable:

```typescript
// ✅ GOOD: Idempotent job
export default async function syncProducts(container: MedusaContainer) {
  const myService = container.resolve("my-service")

  // Check what's already synced
  const lastSyncTime = await myService.getLastSyncTime()

  // Only sync products updated since last sync
  const { data: products } = await query.graph({
    entity: "product",
    filters: {
      updated_at: { $gte: lastSyncTime },
    },
  })

  // Sync products (upsert, don't insert)
  for (const product of products) {
    await myService.upsertToExternalSystem(product)
  }

  // Update last sync time
  await myService.setLastSyncTime(new Date())
}
```

### 4. Use Workflows for Mutations

```typescript
// ✅ GOOD: Uses workflow for mutations
import { deleteCartsWorkflow } from "../workflows/delete-carts"

export default async function cleanupExpiredCarts(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  // Find expired carts
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id"],
    filters: {
      updated_at: {
        $lte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      },
    },
  })

  logger.info(`Found ${carts.length} expired carts`)

  // Use workflow for deletion
  await deleteCartsWorkflow(container).run({
    input: {
      cart_ids: carts.map((c) => c.id),
    },
  })

  logger.info("Expired carts cleaned up")
}
```
