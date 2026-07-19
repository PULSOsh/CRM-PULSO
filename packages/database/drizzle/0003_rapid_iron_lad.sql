CREATE TABLE "briefing_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"questions" jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"status" "record_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "briefings" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "briefings" ADD COLUMN "questions_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "briefings" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "briefings" ADD COLUMN "analyzed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "briefings" ADD CONSTRAINT "briefings_template_id_briefing_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."briefing_templates"("id") ON DELETE no action ON UPDATE no action;