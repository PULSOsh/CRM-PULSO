ALTER TABLE "opportunities" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "resolution_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "resolved_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "opportunities_closed_at_idx" ON "opportunities" USING btree ("closed_at");--> statement-breakpoint
CREATE INDEX "tickets_resolution_started_at_idx" ON "tickets" USING btree ("resolution_started_at");--> statement-breakpoint
CREATE INDEX "tickets_resolved_at_idx" ON "tickets" USING btree ("resolved_at");