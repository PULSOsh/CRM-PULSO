CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualifying', 'qualified', 'disqualified', 'converted');--> statement-breakpoint
CREATE TYPE "public"."prospecting_item_status" AS ENUM('not_researched', 'researched', 'ready', 'contacted', 'waiting_reply', 'follow_up', 'replied', 'qualified', 'not_interested', 'no_response', 'converted');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" varchar(32),
	"document" varchar(32),
	"company_name" text,
	"service" text,
	"source" text,
	"channel" text,
	"message" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"contact_id" uuid,
	"company_id" uuid,
	"opportunity_id" uuid,
	"next_action_at" timestamp with time zone,
	"disqualified_reason" text,
	"utm" jsonb DEFAULT '{}'::jsonb,
	"converted_at" timestamp with time zone,
	"trashed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "prospecting_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"name" text NOT NULL,
	"company_name" text,
	"phone" varchar(32),
	"email" text,
	"instagram" text,
	"website" text,
	"segment" text,
	"status" "prospecting_item_status" DEFAULT 'not_researched' NOT NULL,
	"notes" text,
	"contact_id" uuid,
	"company_id" uuid,
	"lead_id" uuid,
	"last_contact_at" timestamp with time zone,
	"next_action_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospecting_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "record_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prospecting_lists_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospecting_items" ADD CONSTRAINT "prospecting_items_list_id_prospecting_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."prospecting_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospecting_items" ADD CONSTRAINT "prospecting_items_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospecting_items" ADD CONSTRAINT "prospecting_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospecting_items" ADD CONSTRAINT "prospecting_items_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_next_action_idx" ON "leads" USING btree ("next_action_at");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "leads_phone_idx" ON "leads" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "prospecting_items_list_status_idx" ON "prospecting_items" USING btree ("list_id","status");