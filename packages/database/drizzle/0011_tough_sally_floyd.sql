CREATE TABLE "financial_recurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text NOT NULL,
	"direction" text NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"category" text,
	"account_id" uuid,
	"amount" numeric(14, 2) NOT NULL,
	"frequency" text DEFAULT 'monthly' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"next_due_date" date NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "financial_entries" ADD COLUMN "recurrence_id" uuid;--> statement-breakpoint
ALTER TABLE "financial_recurrences" ADD CONSTRAINT "financial_recurrences_account_id_financial_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_recurrence_id_financial_recurrences_id_fk" FOREIGN KEY ("recurrence_id") REFERENCES "public"."financial_recurrences"("id") ON DELETE no action ON UPDATE no action;