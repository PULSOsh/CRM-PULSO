CREATE TABLE "contract_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_signatories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"document" text,
	"role" text DEFAULT 'client' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"signed_at" timestamp with time zone,
	"ip_address" text,
	"user_agent" text,
	"declaration" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "opportunity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "public_slug" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "public_token_hash" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signed_file_id" uuid;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "cancel_reason" text;--> statement-breakpoint
ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signatories" ADD CONSTRAINT "contract_signatories_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contract_events_idempotency_unique" ON "contract_events" USING btree ("idempotency_key");--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_signed_file_id_files_id_fk" FOREIGN KEY ("signed_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contract_public_slug_unique" ON "contracts" USING btree ("public_slug");