CREATE TABLE "admin_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_key" varchar(180) NOT NULL,
	"type" text NOT NULL,
	"title" varchar(120) NOT NULL,
	"summary" varchar(500) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"action_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"telegram_status" text DEFAULT 'pending' NOT NULL,
	"telegram_message_id" integer,
	"telegram_last_error" text,
	"telegram_delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_notifications_event_key_unique" UNIQUE("event_key")
);
--> statement-breakpoint
CREATE TABLE "telegram_pending_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" text NOT NULL,
	"command" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_updates" (
	"update_id" integer PRIMARY KEY NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "admin_notifications_read_idx" ON "admin_notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "admin_notifications_telegram_status_idx" ON "admin_notifications" USING btree ("telegram_status");--> statement-breakpoint
CREATE INDEX "telegram_pending_actions_chat_idx" ON "telegram_pending_actions" USING btree ("chat_id");