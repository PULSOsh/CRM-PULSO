import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const recordStatus = pgEnum("record_status", ["active", "archived", "trashed"]);
export const leadStatus = pgEnum("lead_status", ["new", "contacted", "qualifying", "qualified", "disqualified", "converted"]);
export const prospectingItemStatus = pgEnum("prospecting_item_status", [
  "not_researched", "researched", "ready", "contacted", "waiting_reply", "follow_up", "replied", "qualified", "not_interested", "no_response", "converted"
]);
export const opportunityStatus = pgEnum("opportunity_status", ["open", "won", "lost"]);
export const projectStatus = pgEnum("project_status", ["planned", "active", "waiting", "completed", "cancelled"]);
export const financialStatus = pgEnum("financial_status", ["pending", "partial", "paid", "overdue", "cancelled", "refunded"]);
export const visibility = pgEnum("visibility", ["internal", "client"]);
export const priority = pgEnum("priority", ["low", "normal", "high", "urgent"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("admin").notNull(),
  ...timestamps,
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  ...timestamps,
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  legalName: text("legal_name"),
  tradeName: text("trade_name").notNull(),
  document: varchar("document", { length: 32 }),
  segment: text("segment"),
  website: text("website"),
  instagram: text("instagram"),
  address: jsonb("address").$type<Record<string, string>>().default({}),
  tags: text("tags").array().default([]),
  notes: text("notes"),
  status: recordStatus("status").default("active").notNull(),
  trashedAt: timestamp("trashed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("companies_document_unique").on(table.document),
  index("companies_trade_name_idx").on(table.tradeName),
]);

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  phone: varchar("phone", { length: 32 }),
  document: varchar("document", { length: 32 }),
  role: text("role"),
  city: text("city"),
  instagram: text("instagram"),
  preferredChannel: text("preferred_channel"),
  origin: text("origin"),
  tags: text("tags").array().default([]),
  customFields: jsonb("custom_fields").$type<Record<string, unknown>>().default({}),
  notes: text("notes"),
  status: recordStatus("status").default("active").notNull(),
  trashedAt: timestamp("trashed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("contacts_name_idx").on(table.name),
  index("contacts_email_idx").on(table.email),
  index("contacts_phone_idx").on(table.phone),
]);

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  phone: varchar("phone", { length: 32 }),
  document: varchar("document", { length: 32 }),
  companyName: text("company_name"),
  service: text("service"),
  source: text("source"),
  channel: text("channel"),
  message: text("message"),
  status: leadStatus("status").default("new").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id),
  companyId: uuid("company_id").references(() => companies.id),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  nextActionAt: timestamp("next_action_at", { withTimezone: true }),
  disqualifiedReason: text("disqualified_reason"),
  utm: jsonb("utm").$type<Record<string, string>>().default({}),
  convertedAt: timestamp("converted_at", { withTimezone: true }),
  trashedAt: timestamp("trashed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("leads_status_idx").on(table.status),
  index("leads_next_action_idx").on(table.nextActionAt),
  index("leads_email_idx").on(table.email),
  index("leads_phone_idx").on(table.phone),
]);

export const prospectingLists = pgTable("prospecting_lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  status: recordStatus("status").default("active").notNull(),
  ...timestamps,
});

export const prospectingItems = pgTable("prospecting_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  listId: uuid("list_id").notNull().references(() => prospectingLists.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  companyName: text("company_name"),
  phone: varchar("phone", { length: 32 }),
  email: text("email"),
  instagram: text("instagram"),
  website: text("website"),
  segment: text("segment"),
  status: prospectingItemStatus("status").default("not_researched").notNull(),
  notes: text("notes"),
  contactId: uuid("contact_id").references(() => contacts.id),
  companyId: uuid("company_id").references(() => companies.id),
  leadId: uuid("lead_id").references(() => leads.id),
  lastContactAt: timestamp("last_contact_at", { withTimezone: true }),
  nextActionAt: timestamp("next_action_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("prospecting_items_list_status_idx").on(table.listId, table.status),
]);

export const companyContacts = pgTable("company_contacts", {
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  relationshipRole: text("relationship_role"),
  ...timestamps,
}, (table) => [primaryKey({ columns: [table.companyId, table.contactId] })]);

export const pipelines = pgTable("pipelines", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").default("sales").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  status: recordStatus("status").default("active").notNull(),
  ...timestamps,
});

export const pipelineStages = pgTable("pipeline_stages", {
  id: uuid("id").defaultRandom().primaryKey(),
  pipelineId: uuid("pipeline_id").notNull().references(() => pipelines.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  defaultProbability: integer("default_probability").default(0).notNull(),
  automationConfig: jsonb("automation_config").$type<Record<string, unknown>>().default({}),
  ...timestamps,
}, (table) => [uniqueIndex("pipeline_stage_position_unique").on(table.pipelineId, table.position)]);

export const opportunities = pgTable("opportunities", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  title: text("title").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id),
  companyId: uuid("company_id").references(() => companies.id),
  pipelineId: uuid("pipeline_id").notNull().references(() => pipelines.id),
  stageId: uuid("stage_id").notNull().references(() => pipelineStages.id),
  status: opportunityStatus("status").default("open").notNull(),
  source: text("source"),
  expectedValue: numeric("expected_value", { precision: 14, scale: 2 }).default("0").notNull(),
  probability: integer("probability").default(0).notNull(),
  nextActionAt: timestamp("next_action_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  lostReason: text("lost_reason"),
  customFields: jsonb("custom_fields").$type<Record<string, unknown>>().default({}),
  ...timestamps,
}, (table) => [
  index("opportunities_pipeline_stage_idx").on(table.pipelineId, table.stageId),
  index("opportunities_next_action_idx").on(table.nextActionAt),
  index("opportunities_closed_at_idx").on(table.closedAt),
]);

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  basePrice: numeric("base_price", { precision: 14, scale: 2 }).notNull(),
  billingType: text("billing_type").default("one_time").notNull(),
  estimatedHours: numeric("estimated_hours", { precision: 10, scale: 2 }).default("0").notNull(),
  estimatedCost: numeric("estimated_cost", { precision: 14, scale: 2 }).default("0").notNull(),
  minimumMargin: numeric("minimum_margin", { precision: 5, scale: 2 }).default("0").notNull(),
  allowBriefingSkip: boolean("allow_briefing_skip").default(false).notNull(),
  briefingTemplateId: uuid("briefing_template_id").references(() => briefingTemplates.id),
  configuration: jsonb("configuration").$type<Record<string, unknown>>().default({}),
  status: recordStatus("status").default("active").notNull(),
  ...timestamps,
});

export type BriefingQuestion = {
  id: string;
  type: "text" | "textarea" | "select" | "multiselect" | "boolean" | "date" | "currency" | "link";
  label: string;
  helpText?: string;
  required: boolean;
  options?: string[];
};

export const briefingTemplates = pgTable("briefing_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  version: integer("version").default(1).notNull(),
  questions: jsonb("questions").$type<BriefingQuestion[]>().notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  status: recordStatus("status").default("active").notNull(),
  ...timestamps,
});

export const briefings = pgTable("briefings", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  opportunityId: uuid("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id),
  templateId: uuid("template_id").references(() => briefingTemplates.id),
  questionsSnapshot: jsonb("questions_snapshot").$type<BriefingQuestion[]>(),
  status: text("status").default("draft").notNull(),
  templateVersion: integer("template_version").default(1).notNull(),
  publicSlug: text("public_slug").notNull(),
  publicTokenHash: text("public_token_hash").notNull(),
  responses: jsonb("responses").$type<Record<string, unknown>>().default({}),
  progress: integer("progress").default(0).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  skippedAt: timestamp("skipped_at", { withTimezone: true }),
  skipReason: text("skip_reason"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [uniqueIndex("briefing_public_slug_unique").on(table.publicSlug)]);

export type ProposalItem = { id: string; label: string; description?: string; price: number };
export type ProposalAddon = { id: string; label: string; description?: string; price: number };
export type PaymentCondition = { id: string; label: string; installments: number; feePercent?: number };
export type ProposalContent = {
  intro: string;
  context: string;
  scopeTitle: string;
  scopeItems: ProposalItem[];
  addons: ProposalAddon[];
  paymentConditions: PaymentCondition[];
  termsSummary?: string;
};

export const proposals = pgTable("proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  opportunityId: uuid("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
  status: text("status").default("draft").notNull(),
  publicSlug: text("public_slug").notNull(),
  publicTokenHash: text("public_token_hash").notNull(),
  validUntil: date("valid_until"),
  acceptedVersionId: uuid("accepted_version_id"),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  acceptorName: text("acceptor_name"),
  acceptorDocument: text("acceptor_document"),
  acceptorIp: text("acceptor_ip"),
  acceptorUserAgent: text("acceptor_user_agent"),
  acceptanceDetails: jsonb("acceptance_details").$type<{ selectedAddonIds: string[]; paymentConditionId: string; declaration: string }>(),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  ...timestamps,
}, (table) => [uniqueIndex("proposal_public_slug_unique").on(table.publicSlug)]);

export const proposalVersions = pgTable("proposal_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  proposalId: uuid("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  content: jsonb("content").$type<ProposalContent>().notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 14, scale: 2 }).default("0").notNull(),
  fees: numeric("fees", { precision: 14, scale: 2 }).default("0").notNull(),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  snapshotHash: text("snapshot_hash").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  viewedAt: timestamp("viewed_at", { withTimezone: true }),
  viewCount: integer("view_count").default(0).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("proposal_version_unique").on(table.proposalId, table.version)]);

export const proposalChangeRequests = pgTable("proposal_change_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  proposalId: uuid("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  proposalVersionId: uuid("proposal_version_id").notNull().references(() => proposalVersions.id),
  requestedPaymentLabel: text("requested_payment_label"),
  requestedEntry: numeric("requested_entry", { precision: 14, scale: 2 }),
  requestedInstallments: integer("requested_installments"),
  comment: text("comment"),
  status: text("status").default("pending").notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolutionComment: text("resolution_comment"),
  ...timestamps,
});

export const contracts = pgTable("contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  proposalVersionId: uuid("proposal_version_id").notNull().references(() => proposalVersions.id),
  opportunityId: uuid("opportunity_id").notNull().references(() => opportunities.id),
  status: text("status").default("draft").notNull(),
  provider: text("provider").default("internal").notNull(),
  externalId: text("external_id"),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  documentHash: text("document_hash"),
  publicSlug: text("public_slug"),
  publicTokenHash: text("public_token_hash"),
  signedFileId: uuid("signed_file_id").references(() => files.id),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelReason: text("cancel_reason"),
  ...timestamps,
}, (table) => [uniqueIndex("contract_public_slug_unique").on(table.publicSlug)]);

export const contractSignatories = pgTable("contract_signatories", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  document: text("document"),
  role: text("role").default("client").notNull(),
  position: integer("position").default(0).notNull(),
  status: text("status").default("pending").notNull(),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  declaration: text("declaration"),
  ...timestamps,
});

export const contractEvents = pgTable("contract_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  idempotencyKey: text("idempotency_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("contract_events_idempotency_unique").on(table.idempotencyKey)]);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: text("name").notNull(),
  companyId: uuid("company_id").references(() => companies.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  contractId: uuid("contract_id").references(() => contracts.id),
  status: projectStatus("status").default("planned").notNull(),
  progress: integer("progress").default(0).notNull(),
  startsAt: date("starts_at"),
  dueAt: date("due_at"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  warrantyEndsAt: date("warranty_ends_at"),
  estimatedHours: numeric("estimated_hours", { precision: 10, scale: 2 }).default("0").notNull(),
  budget: numeric("budget", { precision: 14, scale: 2 }).default("0").notNull(),
  ...timestamps,
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("todo").notNull(),
  priority: priority("priority").default("normal").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  reminderAt: timestamp("reminder_at", { withTimezone: true }),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  googleEventId: text("google_event_id"),
  ...timestamps,
}, (table) => [
  index("tasks_due_at_idx").on(table.dueAt),
  index("tasks_entity_idx").on(table.entityType, table.entityId),
]);

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  originalName: text("original_name").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  sha256: text("sha256").notNull(),
  visibility: visibility("visibility").default("internal").notNull(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  trashedAt: timestamp("trashed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("files_sha256_idx").on(table.sha256),
  index("files_entity_idx").on(table.entityType, table.entityId),
]);

export const approvals = pgTable("approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  fileId: uuid("file_id").references(() => files.id),
  title: text("title").notNull(),
  instructions: text("instructions"),
  status: text("status").default("pending").notNull(),
  round: integer("round").default(1).notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  publicSlug: text("public_slug"),
  publicTokenHash: text("public_token_hash"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedByName: text("decided_by_name"),
  decisionComment: text("decision_comment"),
  decisionIp: text("decision_ip"),
  decisionUserAgent: text("decision_user_agent"),
  ...timestamps,
}, (table) => [uniqueIndex("approval_public_slug_unique").on(table.publicSlug)]);

export const timeEntries = pgTable("time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id),
  taskId: uuid("task_id").references(() => tasks.id),
  description: text("description").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes").default(0).notNull(),
  billable: boolean("billable").default(true).notNull(),
  hourlyCost: numeric("hourly_cost", { precision: 14, scale: 2 }).default("0").notNull(),
  ...timestamps,
});

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  companyId: uuid("company_id").references(() => companies.id),
  projectId: uuid("project_id").references(() => projects.id),
  contractId: uuid("contract_id").references(() => contracts.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  priority: priority("priority").default("normal").notNull(),
  status: text("status").default("new").notNull(),
  coverage: text("coverage").default("one_off").notNull(),
  responseDueAt: timestamp("response_due_at", { withTimezone: true }),
  resolutionDueAt: timestamp("resolution_due_at", { withTimezone: true }),
  resolutionStartedAt: timestamp("resolution_started_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("tickets_resolution_started_at_idx").on(table.resolutionStartedAt),
  index("tickets_resolved_at_idx").on(table.resolvedAt),
]);

export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  authorType: text("author_type").notNull(),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  visibility: visibility("visibility").default("client").notNull(),
  ...timestamps,
}, (table) => [index("ticket_messages_ticket_idx").on(table.ticketId)]);

export const financialAccounts = pgTable("financial_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  scope: text("scope").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  openingBalance: numeric("opening_balance", { precision: 14, scale: 2 }).default("0").notNull(),
  status: recordStatus("status").default("active").notNull(),
  ...timestamps,
});

export const financialRecurrences = pgTable("financial_recurrences", {
  id: uuid("id").defaultRandom().primaryKey(),
  scope: text("scope").notNull(),
  direction: text("direction").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  accountId: uuid("account_id").references(() => financialAccounts.id),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  frequency: text("frequency").default("monthly").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  nextDueDate: date("next_due_date").notNull(),
  status: text("status").default("active").notNull(), // active, paused, canceled
  ...timestamps,
});

export const financialEntries = pgTable("financial_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  scope: text("scope").notNull(),
  direction: text("direction").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  accountId: uuid("account_id").references(() => financialAccounts.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  companyId: uuid("company_id").references(() => companies.id),
  projectId: uuid("project_id").references(() => projects.id),
  amountExpected: numeric("amount_expected", { precision: 14, scale: 2 }).notNull(),
  amountActual: numeric("amount_actual", { precision: 14, scale: 2 }).default("0").notNull(),
  competenceDate: date("competence_date").notNull(),
  dueDate: date("due_date"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  status: financialStatus("status").default("pending").notNull(),
  paymentMethod: text("payment_method"),
  provider: text("provider").default("manual").notNull(),
  externalId: text("external_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  ...timestamps,
}, (table) => [
  index("financial_scope_due_idx").on(table.scope, table.dueDate),
  index("financial_project_idx").on(table.projectId),
]);

export const portalUsers = pgTable("portal_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  status: text("status").default("invited").notNull(),
  activationTokenHash: text("activation_token_hash"),
  invitedAt: timestamp("invited_at", { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [uniqueIndex("portal_user_company_email_unique").on(table.companyId, table.email)]);

export const portalSessions = pgTable("portal_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  portalUserId: uuid("portal_user_id").notNull().references(() => portalUsers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  ...timestamps,
}, (table) => [uniqueIndex("portal_session_token_hash_unique").on(table.tokenHash)]);

export const portalPermissions = pgTable("portal_permissions", {
  portalUserId: uuid("portal_user_id").notNull().references(() => portalUsers.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  role: text("role").default("client").notNull(),
  permissions: text("permissions").array().default([]),
  ...timestamps,
}, (table) => [primaryKey({ columns: [table.portalUserId, table.projectId] })]);

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  type: text("type").notNull(),
  channel: text("channel"),
  summary: text("summary").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().default({}),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: text("created_by").default("system").notNull(),
  ...timestamps,
}, (table) => [
  index("activities_entity_idx").on(table.entityType, table.entityId),
  index("activities_occurred_at_idx").on(table.occurredAt),
]);

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorType: text("actor_type").notNull(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  before: jsonb("before").$type<Record<string, unknown>>(),
  after: jsonb("after").$type<Record<string, unknown>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  hash: text("hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_entity_idx").on(table.entityType, table.entityId),
  index("audit_created_at_idx").on(table.createdAt),
]);

export const integrationSettings = pgTable("integration_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  provider: text("provider").notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  status: text("status").default("not_configured").notNull(),
  encryptedConfiguration: text("encrypted_configuration"),
  lastTestAt: timestamp("last_test_at", { withTimezone: true }),
  lastError: text("last_error"),
  ...timestamps,
});

export const counters = pgTable("counters", {
  namespace: text("namespace").notNull(),
  year: integer("year").notNull(),
  value: integer("value").default(0).notNull(),
}, (table) => [primaryKey({ columns: [table.namespace, table.year] })]);

/** Linha única (id fixo "singleton") com dados institucionais preenchidos no onboarding. */
export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey().default("singleton"),
  workspaceName: text("workspace_name"),
  legalName: text("legal_name"),
  document: varchar("document", { length: 32 }),
  logoUrl: text("logo_url"),
  monthlyRevenueGoal: numeric("monthly_revenue_goal", { precision: 14, scale: 2 }),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  ...timestamps,
});

export const NOTIFICATION_TELEGRAM_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  DISABLED: "disabled",
  ERROR: "error",
} as const;
export type NotificationTelegramStatus = typeof NOTIFICATION_TELEGRAM_STATUS[keyof typeof NOTIFICATION_TELEGRAM_STATUS];

export const adminNotifications = pgTable("admin_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventKey: varchar("event_key", { length: 180 }).notNull().unique(),
  type: text("type").notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  summary: varchar("summary", { length: 500 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
  actionUrl: text("action_url"),
  isRead: boolean("is_read").default(false).notNull(),
  telegramStatus: text("telegram_status").default("pending").notNull(),
  telegramMessageId: integer("telegram_message_id"),
  telegramLastError: text("telegram_last_error"),
  telegramDeliveredAt: timestamp("telegram_delivered_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("admin_notifications_read_idx").on(table.isRead),
  index("admin_notifications_telegram_status_idx").on(table.telegramStatus),
]);

export const telegramUpdates = pgTable("telegram_updates", {
  updateId: integer("update_id").primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const telegramPendingActions = pgTable("telegram_pending_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: text("chat_id").notNull(),
  command: text("command").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("telegram_pending_actions_chat_idx").on(table.chatId),
]);
