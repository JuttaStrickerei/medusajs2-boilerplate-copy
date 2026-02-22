import { Migration } from "@mikro-orm/migrations"

export class Migration20260222140000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "sendcloud_shipment" (
        "id" text NOT NULL,
        "order_id" text NOT NULL,
        "sendcloud_id" text,
        "tracking_number" text,
        "tracking_url" text,
        "carrier" text,
        "service_point_id" text,
        "service_point_name" text,
        "service_point_address" text,
        "status" text NOT NULL DEFAULT 'created',
        "is_return" boolean NOT NULL DEFAULT false,
        "weight" real,
        "length" real,
        "width" real,
        "height" real,
        "recipient_name" text NOT NULL,
        "recipient_company" text,
        "recipient_address" text NOT NULL,
        "recipient_house_number" text NOT NULL,
        "recipient_city" text NOT NULL,
        "recipient_postal_code" text NOT NULL,
        "recipient_country" text NOT NULL,
        "recipient_email" text,
        "recipient_phone" text,
        "sendcloud_response" jsonb,
        "error_message" text,
        "retry_count" integer NOT NULL DEFAULT 0,
        "label_url" text,
        "shipped_at" timestamptz,
        "delivered_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "sendcloud_shipment_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_sendcloud_shipment_order_id" ON "sendcloud_shipment" ("order_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_sendcloud_shipment_sendcloud_id" ON "sendcloud_shipment" ("sendcloud_id");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_sendcloud_shipment_tracking_number" ON "sendcloud_shipment" ("tracking_number");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_sendcloud_shipment_status" ON "sendcloud_shipment" ("status");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_sendcloud_shipment_is_return" ON "sendcloud_shipment" ("is_return");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_sendcloud_shipment_deleted_at" ON "sendcloud_shipment" ("deleted_at") WHERE "deleted_at" IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "sendcloud_shipment" CASCADE;`)
  }
}
