import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261127191900 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "newsletter_herkunft" drop constraint if exists "newsletter_herkunft_code_unique";`);
    this.addSql(`create table if not exists "newsletter_herkunft" ("id" text not null, "code" text not null, "data" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "newsletter_herkunft_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_newsletter_herkunft_code_unique" ON "newsletter_herkunft" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_newsletter_herkunft_deleted_at" ON "newsletter_herkunft" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "newsletter_herkunft" cascade;`);
  }

}
