ALTER TABLE "approvals" ADD COLUMN "code" varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "public_slug" text;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "public_token_hash" text;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "decided_by_name" text;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "decision_ip" text;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "decision_user_agent" text;--> statement-breakpoint
CREATE UNIQUE INDEX "approval_public_slug_unique" ON "approvals" USING btree ("public_slug");--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_code_unique" UNIQUE("code");