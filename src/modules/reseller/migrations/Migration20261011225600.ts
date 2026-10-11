import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261011225600 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "reseller" add column if not exists "raw_commission_rate" jsonb null;`);
    this.addSql(`alter table if exists "reseller_order" add column if not exists "raw_retail_total" jsonb null;`);
    this.addSql(`alter table if exists "reseller_order" add column if not exists "raw_reseller_cost" jsonb null;`);
    this.addSql(`alter table if exists "reseller_order" add column if not exists "raw_commission_earned" jsonb null;`);
    this.addSql(`alter table if exists "reseller_payout" add column if not exists "raw_amount" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "reseller" drop column if exists "raw_commission_rate";`);
    this.addSql(`alter table if exists "reseller_order" drop column if exists "raw_retail_total";`);
    this.addSql(`alter table if exists "reseller_order" drop column if exists "raw_reseller_cost";`);
    this.addSql(`alter table if exists "reseller_order" drop column if exists "raw_commission_earned";`);
    this.addSql(`alter table if exists "reseller_payout" drop column if exists "raw_amount";`);
  }
}
