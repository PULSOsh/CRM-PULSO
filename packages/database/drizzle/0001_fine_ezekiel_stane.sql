CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"workspace_name" text,
	"legal_name" text,
	"document" varchar(32),
	"logo_url" text,
	"monthly_revenue_goal" numeric(14, 2),
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
