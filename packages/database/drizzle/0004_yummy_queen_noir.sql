CREATE TABLE "proposal_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"proposal_version_id" uuid NOT NULL,
	"requested_payment_label" text,
	"requested_entry" numeric(14, 2),
	"requested_installments" integer,
	"comment" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolution_comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposal_versions" ADD COLUMN "viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "proposal_versions" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "accepted_version_id" uuid;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "acceptor_name" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "acceptor_document" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "acceptor_ip" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "acceptor_user_agent" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "acceptance_details" jsonb;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "rejected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "proposal_change_requests" ADD CONSTRAINT "proposal_change_requests_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_change_requests" ADD CONSTRAINT "proposal_change_requests_proposal_version_id_proposal_versions_id_fk" FOREIGN KEY ("proposal_version_id") REFERENCES "public"."proposal_versions"("id") ON DELETE no action ON UPDATE no action;