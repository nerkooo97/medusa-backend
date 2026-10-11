import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261011184627 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "marketplace_connection" ("id" text not null, "name" text not null, "provider_id" text not null, "auth_type" text check ("auth_type" in ('credentials_login', 'bearer_token', 'api_key', 'oauth2')) not null default 'credentials_login', "credentials" jsonb not null, "base_url" text null, "is_active" boolean not null default true, "auto_sync_stock" boolean not null default true, "auto_sync_prices" boolean not null default false, "default_stock_location_id" text null, "default_settings" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketplace_connection_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketplace_connection_deleted_at" ON "marketplace_connection" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "marketplace_category_mapping" ("id" text not null, "medusa_category_id" text not null, "external_category_id" text not null, "external_category_name" text null, "auto_publish" boolean not null default false, "metadata" jsonb null, "connection_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketplace_category_mapping_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketplace_category_mapping_connection_id" ON "marketplace_category_mapping" ("connection_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketplace_category_mapping_deleted_at" ON "marketplace_category_mapping" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "marketplace_field_mapping" ("id" text not null, "external_category_id" text null, "external_attribute_id" text not null, "external_attribute_name" text null, "source_type" text check ("source_type" in ('product_field', 'variant_field', 'metadata', 'fixed_value', 'template')) not null default 'fixed_value', "source_key" text not null, "default_value" text null, "value_mappings" jsonb null, "transformation" text null, "connection_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketplace_field_mapping_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketplace_field_mapping_connection_id" ON "marketplace_field_mapping" ("connection_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketplace_field_mapping_deleted_at" ON "marketplace_field_mapping" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "marketplace_listing" ("id" text not null, "product_id" text not null, "variant_id" text null, "external_id" text not null, "external_url" text null, "status" text check ("status" in ('draft', 'active', 'hidden', 'finished', 'failed')) not null default 'draft', "last_synced_price" numeric null, "last_synced_quantity" integer not null default 0, "sync_hash" text null, "last_synced_at" timestamptz null, "last_sync_error" text null, "external_data" jsonb null, "connection_id" text not null, "raw_last_synced_price" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketplace_listing_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketplace_listing_connection_id" ON "marketplace_listing" ("connection_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketplace_listing_deleted_at" ON "marketplace_listing" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "marketplace_sync_log" ("id" text not null, "event_type" text not null, "status" text check ("status" in ('success', 'error', 'warning')) not null default 'success', "payload" jsonb null, "response" jsonb null, "error_message" text null, "connection_id" text not null, "listing_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketplace_sync_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketplace_sync_log_connection_id" ON "marketplace_sync_log" ("connection_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketplace_sync_log_listing_id" ON "marketplace_sync_log" ("listing_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_marketplace_sync_log_deleted_at" ON "marketplace_sync_log" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "marketplace_category_mapping" add constraint "marketplace_category_mapping_connection_id_foreign" foreign key ("connection_id") references "marketplace_connection" ("id") on update cascade;`);

    this.addSql(`alter table if exists "marketplace_field_mapping" add constraint "marketplace_field_mapping_connection_id_foreign" foreign key ("connection_id") references "marketplace_connection" ("id") on update cascade;`);

    this.addSql(`alter table if exists "marketplace_listing" add constraint "marketplace_listing_connection_id_foreign" foreign key ("connection_id") references "marketplace_connection" ("id") on update cascade;`);

    this.addSql(`alter table if exists "marketplace_sync_log" add constraint "marketplace_sync_log_connection_id_foreign" foreign key ("connection_id") references "marketplace_connection" ("id") on update cascade;`);
    this.addSql(`alter table if exists "marketplace_sync_log" add constraint "marketplace_sync_log_listing_id_foreign" foreign key ("listing_id") references "marketplace_listing" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "marketplace_category_mapping" drop constraint if exists "marketplace_category_mapping_connection_id_foreign";`);

    this.addSql(`alter table if exists "marketplace_field_mapping" drop constraint if exists "marketplace_field_mapping_connection_id_foreign";`);

    this.addSql(`alter table if exists "marketplace_listing" drop constraint if exists "marketplace_listing_connection_id_foreign";`);

    this.addSql(`alter table if exists "marketplace_sync_log" drop constraint if exists "marketplace_sync_log_connection_id_foreign";`);

    this.addSql(`alter table if exists "marketplace_sync_log" drop constraint if exists "marketplace_sync_log_listing_id_foreign";`);

    this.addSql(`drop table if exists "marketplace_connection" cascade;`);

    this.addSql(`drop table if exists "marketplace_category_mapping" cascade;`);

    this.addSql(`drop table if exists "marketplace_field_mapping" cascade;`);

    this.addSql(`drop table if exists "marketplace_listing" cascade;`);

    this.addSql(`drop table if exists "marketplace_sync_log" cascade;`);
  }

}
