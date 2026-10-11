import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261011160009 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "stock_transfer" drop constraint if exists "stock_transfer_transfer_number_unique";`);
    this.addSql(`alter table if exists "goods_receipt" drop constraint if exists "goods_receipt_receipt_number_unique";`);
    this.addSql(`create table if not exists "goods_receipt" ("id" text not null, "receipt_number" text not null, "supplier_name" text not null, "invoice_number" text not null, "invoice_date" timestamptz null, "received_at" timestamptz null, "stock_location_id" text not null, "status" text check ("status" in ('draft', 'posted', 'cancelled')) not null default 'draft', "notes" text null, "created_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "goods_receipt_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_goods_receipt_receipt_number_unique" ON "goods_receipt" ("receipt_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_goods_receipt_deleted_at" ON "goods_receipt" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "goods_receipt_item" ("id" text not null, "inventory_item_id" text not null, "sku" text not null, "title" text null, "quantity" integer not null, "unit_cost" numeric null, "total_cost" numeric null, "batch_number" text null, "goods_receipt_id" text not null, "raw_unit_cost" jsonb null, "raw_total_cost" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "goods_receipt_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_goods_receipt_item_goods_receipt_id" ON "goods_receipt_item" ("goods_receipt_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_goods_receipt_item_deleted_at" ON "goods_receipt_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "stock_movement" ("id" text not null, "inventory_item_id" text not null, "stock_location_id" text not null, "sku" text null, "quantity_change" integer not null, "balance_after" integer null, "document_type" text check ("document_type" in ('receipt', 'transfer_dispatch', 'transfer_receive', 'order_fulfillment', 'adjustment')) not null, "document_id" text not null, "reference_number" text null, "notes" text null, "created_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "stock_movement_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stock_movement_deleted_at" ON "stock_movement" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "stock_transfer" ("id" text not null, "transfer_number" text not null, "source_location_id" text not null, "destination_location_id" text not null, "status" text check ("status" in ('draft', 'in_transit', 'completed', 'cancelled')) not null default 'draft', "dispatched_at" timestamptz null, "received_at" timestamptz null, "notes" text null, "created_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "stock_transfer_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_stock_transfer_transfer_number_unique" ON "stock_transfer" ("transfer_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stock_transfer_deleted_at" ON "stock_transfer" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "stock_transfer_item" ("id" text not null, "inventory_item_id" text not null, "sku" text not null, "title" text null, "quantity" integer not null, "stock_transfer_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "stock_transfer_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stock_transfer_item_stock_transfer_id" ON "stock_transfer_item" ("stock_transfer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stock_transfer_item_deleted_at" ON "stock_transfer_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "goods_receipt_item" add constraint "goods_receipt_item_goods_receipt_id_foreign" foreign key ("goods_receipt_id") references "goods_receipt" ("id") on update cascade;`);

    this.addSql(`alter table if exists "stock_transfer_item" add constraint "stock_transfer_item_stock_transfer_id_foreign" foreign key ("stock_transfer_id") references "stock_transfer" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "goods_receipt_item" drop constraint if exists "goods_receipt_item_goods_receipt_id_foreign";`);

    this.addSql(`alter table if exists "stock_transfer_item" drop constraint if exists "stock_transfer_item_stock_transfer_id_foreign";`);

    this.addSql(`drop table if exists "goods_receipt" cascade;`);

    this.addSql(`drop table if exists "goods_receipt_item" cascade;`);

    this.addSql(`drop table if exists "stock_movement" cascade;`);

    this.addSql(`drop table if exists "stock_transfer" cascade;`);

    this.addSql(`drop table if exists "stock_transfer_item" cascade;`);
  }

}
