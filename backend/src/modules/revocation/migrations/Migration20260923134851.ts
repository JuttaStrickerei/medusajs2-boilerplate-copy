import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260923134851 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "revocation_declaration" ("id" text not null, "display_id" serial, "received_at" timestamptz not null, "customer_name" text not null, "order_reference" text not null, "email" text not null, "scope" text check ("scope" in ('full', 'partial')) not null, "partial_text" text null, "declaration_text" text not null, "confirmation_sent_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "revocation_declaration_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_revocation_declaration_deleted_at" ON "revocation_declaration" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "revocation_declaration" cascade;`);
  }

}
