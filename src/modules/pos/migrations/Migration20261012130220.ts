import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261012130220 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "pos_register" drop constraint if exists "pos_register_device_key_unique";`);
    this.addSql(`alter table if exists "pos_register" drop constraint if exists "pos_register_code_unique";`);
    this.addSql(`create table if not exists "pos_register" ("id" text not null, "name" text not null, "code" text not null, "description" text null, "status" text check ("status" in ('active', 'inactive', 'maintenance')) not null default 'active', "store_name" text not null, "store_address" text not null, "store_city" text not null, "store_postal_code" text not null, "store_country_code" text not null default 'ba', "store_phone" text null, "store_email" text null, "tax_id" text null, "vat_id" text null, "sales_channel_id" text null, "stock_location_id" text null, "supported_payment_methods" jsonb not null default '["cash","card","wire_transfer"]', "default_payment_method" text not null default 'cash', "fiscal_printer_type" text null, "fiscal_printer_ip" text null, "fiscal_printer_port" integer null, "fiscal_device_serial" text null, "receipt_header" text null, "receipt_footer" text null, "device_key" text not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pos_register_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pos_register_code_unique" ON "pos_register" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pos_register_device_key_unique" ON "pos_register" ("device_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pos_register_deleted_at" ON "pos_register" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "pos_register_operator" ("id" text not null, "user_id" text not null, "role" text check ("role" in ('cashier', 'supervisor', 'admin')) not null default 'cashier', "pin_code" text null, "is_active" boolean not null default true, "metadata" jsonb null, "register_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pos_register_operator_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pos_register_operator_register_id" ON "pos_register_operator" ("register_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pos_register_operator_deleted_at" ON "pos_register_operator" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "pos_register_session" ("id" text not null, "opened_by_user_id" text not null, "closed_by_user_id" text null, "status" text check ("status" in ('open', 'closed')) not null default 'open', "opened_at" timestamptz not null, "closed_at" timestamptz null, "opening_cash" numeric not null default 0, "closing_cash" numeric null, "expected_cash" numeric null, "notes" text null, "metadata" jsonb null, "register_id" text not null, "raw_opening_cash" jsonb not null default '{"value":"0","precision":20}', "raw_closing_cash" jsonb null, "raw_expected_cash" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pos_register_session_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pos_register_session_register_id" ON "pos_register_session" ("register_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pos_register_session_deleted_at" ON "pos_register_session" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "pos_register_operator" add constraint "pos_register_operator_register_id_foreign" foreign key ("register_id") references "pos_register" ("id") on update cascade;`);

    this.addSql(`alter table if exists "pos_register_session" add constraint "pos_register_session_register_id_foreign" foreign key ("register_id") references "pos_register" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "pos_register_operator" drop constraint if exists "pos_register_operator_register_id_foreign";`);

    this.addSql(`alter table if exists "pos_register_session" drop constraint if exists "pos_register_session_register_id_foreign";`);

    this.addSql(`drop table if exists "pos_register" cascade;`);

    this.addSql(`drop table if exists "pos_register_operator" cascade;`);

    this.addSql(`drop table if exists "pos_register_session" cascade;`);
  }

}
