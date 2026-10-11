import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261011223000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "reseller" (
      "id" text not null,
      "name" text not null,
      "contact_person" text null,
      "email" text not null,
      "phone" text not null,
      "status" text check ("status" in ('active', 'inactive', 'blocked')) not null default 'active',
      "commission_type" text check ("commission_type" in ('percentage', 'fixed_amount')) not null default 'percentage',
      "commission_rate" numeric not null default 10,
      "raw_commission_rate" jsonb null,
      "sales_channel_id" text null,
      "api_key" text not null,
      "payout_info" jsonb null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "reseller_pkey" primary key ("id"),
      constraint "reseller_email_unique" unique ("email"),
      constraint "reseller_api_key_unique" unique ("api_key")
    );`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_reseller_deleted_at" ON "reseller" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_reseller_api_key" ON "reseller" ("api_key");`);

    this.addSql(`create table if not exists "reseller_payout" (
      "id" text not null,
      "amount" numeric not null,
      "raw_amount" jsonb null,
      "payment_method" text not null default 'bank_transfer',
      "reference_number" text null,
      "status" text check ("status" in ('pending', 'completed', 'canceled')) not null default 'completed',
      "notes" text null,
      "paid_at" timestamptz null,
      "reseller_id" text not null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "reseller_payout_pkey" primary key ("id")
    );`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_reseller_payout_reseller_id" ON "reseller_payout" ("reseller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_reseller_payout_deleted_at" ON "reseller_payout" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "reseller_order" (
      "id" text not null,
      "order_id" text not null,
      "customer_name" text not null,
      "customer_phone" text not null,
      "customer_address" text not null,
      "customer_city" text not null,
      "customer_postal_code" text null,
      "retail_total" numeric not null default 0,
      "raw_retail_total" jsonb null,
      "reseller_cost" numeric not null default 0,
      "raw_reseller_cost" jsonb null,
      "commission_earned" numeric not null default 0,
      "raw_commission_earned" jsonb null,
      "order_status" text check ("order_status" in ('pending', 'processing', 'shipped', 'delivered', 'returned', 'canceled')) not null default 'pending',
      "payout_status" text check ("payout_status" in ('unearned', 'eligible', 'paid')) not null default 'unearned',
      "reseller_id" text not null,
      "payout_id" text null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "reseller_order_pkey" primary key ("id"),
      constraint "reseller_order_order_id_unique" unique ("order_id")
    );`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_reseller_order_reseller_id" ON "reseller_order" ("reseller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_reseller_order_order_id" ON "reseller_order" ("order_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_reseller_order_payout_id" ON "reseller_order" ("payout_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_reseller_order_deleted_at" ON "reseller_order" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "reseller_payout" add constraint "reseller_payout_reseller_id_foreign" foreign key ("reseller_id") references "reseller" ("id") on update cascade;`);
    this.addSql(`alter table if exists "reseller_order" add constraint "reseller_order_reseller_id_foreign" foreign key ("reseller_id") references "reseller" ("id") on update cascade;`);
    this.addSql(`alter table if exists "reseller_order" add constraint "reseller_order_payout_id_foreign" foreign key ("payout_id") references "reseller_payout" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "reseller_order" drop constraint if exists "reseller_order_payout_id_foreign";`);
    this.addSql(`alter table if exists "reseller_order" drop constraint if exists "reseller_order_reseller_id_foreign";`);
    this.addSql(`alter table if exists "reseller_payout" drop constraint if exists "reseller_payout_reseller_id_foreign";`);
    this.addSql(`drop table if exists "reseller_order" cascade;`);
    this.addSql(`drop table if exists "reseller_payout" cascade;`);
    this.addSql(`drop table if exists "reseller" cascade;`);
  }
}
