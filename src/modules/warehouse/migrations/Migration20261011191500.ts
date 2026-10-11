import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261011191500 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "stock_write_off" ("id" text not null, "write_off_number" text not null, "stock_location_id" text not null, "reason" text check ("reason" in ('damaged', 'expired', 'lost', 'internal_use', 'other')) not null default 'damaged', "status" text check ("status" in ('draft', 'posted', 'cancelled')) not null default 'draft', "notes" text null, "commission_members" text null, "created_by" text null, "posted_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "stock_write_off_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_stock_write_off_write_off_number_unique" ON "stock_write_off" ("write_off_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stock_write_off_deleted_at" ON "stock_write_off" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "stock_write_off_item" ("id" text not null, "inventory_item_id" text not null, "sku" text not null, "title" text null, "quantity" integer not null, "unit_cost" numeric null, "total_cost" numeric null, "item_notes" text null, "stock_write_off_id" text not null, "raw_unit_cost" jsonb null, "raw_total_cost" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "stock_write_off_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stock_write_off_item_stock_write_off_id" ON "stock_write_off_item" ("stock_write_off_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stock_write_off_item_deleted_at" ON "stock_write_off_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "stock_write_off_item" drop constraint if exists "stock_write_off_item_stock_write_off_id_foreign";`);
    this.addSql(`alter table if exists "stock_write_off_item" add constraint "stock_write_off_item_stock_write_off_id_foreign" foreign key ("stock_write_off_id") references "stock_write_off" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "stock_write_off_item" drop constraint if exists "stock_write_off_item_stock_write_off_id_foreign";`);
    this.addSql(`drop table if exists "stock_write_off_item" cascade;`);
    this.addSql(`drop table if exists "stock_write_off" cascade;`);
  }

}
