import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260923134946 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "look" drop constraint if exists "look_handle_unique";`);
    this.addSql(`create table if not exists "look" ("id" text not null, "title" text not null, "handle" text not null, "description" text null, "images" text[] null, "status" text check ("status" in ('draft', 'published')) not null default 'draft', "rank" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "look_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_look_handle_unique" ON "look" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_look_deleted_at" ON "look" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "look_item" ("id" text not null, "rank" integer not null default 0, "look_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "look_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_look_item_look_id" ON "look_item" ("look_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_look_item_deleted_at" ON "look_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "look_item" add constraint "look_item_look_id_foreign" foreign key ("look_id") references "look" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "look_item" drop constraint if exists "look_item_look_id_foreign";`);

    this.addSql(`drop table if exists "look" cascade;`);

    this.addSql(`drop table if exists "look_item" cascade;`);
  }

}
