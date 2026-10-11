import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261011213000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "marketplace_connection" add column if not exists "sales_channel_id" text not null default '';`);
    this.addSql(`alter table if exists "marketplace_connection" drop constraint if exists "marketplace_connection_auth_type_check";`);
    this.addSql(`alter table if exists "marketplace_connection" add constraint "marketplace_connection_auth_type_check" check ("auth_type" in ('credentials_login', 'credentials', 'bearer_token', 'api_key', 'client_tokens', 'oauth2'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "marketplace_connection" drop column if exists "sales_channel_id";`);
  }

}
