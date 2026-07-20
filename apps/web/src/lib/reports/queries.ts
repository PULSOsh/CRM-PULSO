import { db, schema } from "@pulso/database";
import { and, eq, gte, inArray, lt, lte, notInArray } from "drizzle-orm";
import {
  APPROVAL_REPORT_STATUS,
  COMMERCIAL_REPORT_ROW_TYPE,
  FINANCIAL_REPORT_DIRECTION,
  OPERATIONS_REPORT_EVENT,
  OPERATIONS_REPORT_ROW_TYPE,
  type CommercialReportRowType,
  type FinancialReportDirection,
  type OperationsReportEvent,
  type OperationsReportRowType,
  type ReportPeriod
} from "./constants";
import { getCurrentLocalDayBounds, resolveReportPeriod, type ReportPeriodBounds } from "./period";

type LeadRecord = typeof schema.leads.$inferSelect;
type OpportunityRecord = typeof schema.opportunities.$inferSelect;
type FinancialEntryRecord = typeof schema.financialEntries.$inferSelect;

export interface ReportStatusCount {
  status: string;
  count: number;
}

export interface ReportSourceCount {
  source: string | null;
  count: number;
}

export interface CommercialLeadMetrics {
  createdCount: number;
  byStatus: ReportStatusCount[];
  bySource: ReportSourceCount[];
  conversionRate: number | null;
}

export interface CommercialOpportunityMetrics {
  createdCount: number;
  openPipelineCount: number;
  openPipelineValue: number;
  wonCount: number;
  lostCount: number;
  wonValue: number;
  winRate: number | null;
}

export interface CommercialReportRow {
  id: string;
  type: CommercialReportRowType;
  code: string;
  title: string;
  status: string;
  source: string | null;
  expectedValue: number | null;
  createdAt: Date;
  closedAt: Date | null;
}

export interface CommercialReport {
  leads: CommercialLeadMetrics;
  opportunities: CommercialOpportunityMetrics;
  rows: CommercialReportRow[];
}

export interface OperationsSnapshotMetrics {
  projectsByStatus: ReportStatusCount[];
  pendingApprovalsCount: number;
}

export interface OperationsApprovalMetrics {
  approvedCount: number;
  changesRequestedCount: number;
}

export interface OperationsTimeMetrics {
  registeredMinutes: number;
  relatedProjectsEstimatedHours: number;
}

export interface OperationsTicketMetrics {
  createdCount: number;
  createdByStatus: ReportStatusCount[];
  resolvedCycleCount: number;
  averageResolutionMinutes: number | null;
}

export interface OperationsMovementMetrics {
  approvals: OperationsApprovalMetrics;
  time: OperationsTimeMetrics;
  tickets: OperationsTicketMetrics;
}

export interface OperationsReportRow {
  entityId: string;
  type: OperationsReportRowType;
  event: OperationsReportEvent;
  code: string | null;
  title: string;
  status: string | null;
  project: string | null;
  eventDate: Date | null;
  minutes: number | null;
  resolutionMinutes: number | null;
}

export interface OperationsReport {
  snapshot: OperationsSnapshotMetrics;
  movement: OperationsMovementMetrics;
  rows: OperationsReportRow[];
}

export interface ResolvedTicketReportInput {
  id: string;
  code: string;
  title: string;
  status: string;
  resolutionStartedAt: Date | null;
  resolvedAt: Date;
  projectName: string | null;
}

export interface ResolvedTicketReportData {
  rows: OperationsReportRow[];
  resolvedCycleCount: number;
  averageResolutionMinutes: number | null;
}

export interface FinancialForecastMetrics {
  incomeExpected: number;
  expenseExpected: number;
}

export interface FinancialActualMetrics {
  incomeActual: number;
  expenseActual: number;
  result: number;
}

export interface FinancialOverdueMetrics {
  count: number;
  residualBalance: number;
}

export interface FinancialReportRow {
  id: string;
  code: string;
  direction: FinancialReportDirection;
  type: string;
  description: string;
  status: FinancialEntryRecord["status"];
  competenceDate: string;
  dueDate: string | null;
  paidAt: Date | null;
  expectedAmount: number;
  actualAmount: number;
}

export interface FinancialReport {
  forecast: FinancialForecastMetrics;
  actual: FinancialActualMetrics;
  overdue: FinancialOverdueMetrics;
  rows: FinancialReportRow[];
}

interface IdentifiedRow {
  id: string;
}

interface ApprovalReportQueryRow {
  id: string;
  code: string;
  title: string;
  status: string;
  decidedAt: Date | null;
  projectName: string;
}

interface TimeReportQueryRow {
  id: string;
  description: string;
  startedAt: Date;
  durationMinutes: number;
  projectId: string | null;
  projectName: string | null;
  projectCode: string | null;
  projectEstimatedHours: string | null;
}

interface TicketReportQueryRow {
  id: string;
  code: string;
  title: string;
  status: string;
  createdAt: Date;
  resolutionStartedAt: Date | null;
  resolvedAt: Date | null;
  projectName: string | null;
}

const TERMINAL_FINANCIAL_STATUS: FinancialEntryRecord["status"][] = [
  "paid",
  "cancelled",
  "refunded"
];

export function calculateRate(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

export function calculateResidualBalance(expected: number, actual: number): number {
  return Math.max(expected - actual, 0);
}

export function deduplicateById<T extends IdentifiedRow>(rows: readonly T[]): T[] {
  const byId = new Map<string, T>();

  for (const row of rows) {
    if (!byId.has(row.id)) {
      byId.set(row.id, row);
    }
  }

  return Array.from(byId.values());
}

function countByStatus<T extends { status: string }>(rows: readonly T[]): ReportStatusCount[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }

  return Array.from(counts, ([status, count]) => ({ status, count })).sort((left, right) =>
    left.status.localeCompare(right.status)
  );
}

function countLeadsBySource(rows: readonly Pick<LeadRecord, "source">[]): ReportSourceCount[] {
  const counts = new Map<string | null, number>();

  for (const row of rows) {
    counts.set(row.source, (counts.get(row.source) ?? 0) + 1);
  }

  return Array.from(counts, ([source, count]) => ({ source, count })).sort((left, right) =>
    (left.source ?? "").localeCompare(right.source ?? "")
  );
}

function isInTimestampPeriod(date: Date, bounds: ReportPeriodBounds): boolean {
  return (bounds.start === null || date >= bounds.start) && date < bounds.end;
}

function toCommercialLeadRow(lead: Pick<LeadRecord, "id" | "code" | "name" | "status" | "source" | "createdAt">): CommercialReportRow {
  return {
    id: lead.id,
    type: COMMERCIAL_REPORT_ROW_TYPE.LEAD,
    code: lead.code,
    title: lead.name,
    status: lead.status,
    source: lead.source,
    expectedValue: null,
    createdAt: lead.createdAt,
    closedAt: null
  };
}

function toCommercialOpportunityRow(
  opportunity: Pick<OpportunityRecord, "id" | "code" | "title" | "status" | "source" | "expectedValue" | "createdAt" | "closedAt">
): CommercialReportRow {
  return {
    id: opportunity.id,
    type: COMMERCIAL_REPORT_ROW_TYPE.OPPORTUNITY,
    code: opportunity.code,
    title: opportunity.title,
    status: opportunity.status,
    source: opportunity.source,
    expectedValue: Number(opportunity.expectedValue),
    createdAt: opportunity.createdAt,
    closedAt: opportunity.closedAt
  };
}

export async function getCommercialReport(period: ReportPeriod): Promise<CommercialReport> {
  const bounds = resolveReportPeriod(period);
  const timestampStart = bounds.start;

  const [leadRows, opportunityCreatedRows, opportunityClosedRows, openOpportunityRows] = await Promise.all([
    db
      .select({
        id: schema.leads.id,
        code: schema.leads.code,
        name: schema.leads.name,
        status: schema.leads.status,
        source: schema.leads.source,
        createdAt: schema.leads.createdAt
      })
      .from(schema.leads)
      .where(and(timestampStart ? gte(schema.leads.createdAt, timestampStart) : undefined, lt(schema.leads.createdAt, bounds.end))),
    db
      .select({
        id: schema.opportunities.id,
        code: schema.opportunities.code,
        title: schema.opportunities.title,
        status: schema.opportunities.status,
        source: schema.opportunities.source,
        expectedValue: schema.opportunities.expectedValue,
        createdAt: schema.opportunities.createdAt,
        closedAt: schema.opportunities.closedAt
      })
      .from(schema.opportunities)
      .where(
        and(
          timestampStart ? gte(schema.opportunities.createdAt, timestampStart) : undefined,
          lt(schema.opportunities.createdAt, bounds.end)
        )
      ),
    db
      .select({
        id: schema.opportunities.id,
        code: schema.opportunities.code,
        title: schema.opportunities.title,
        status: schema.opportunities.status,
        source: schema.opportunities.source,
        expectedValue: schema.opportunities.expectedValue,
        createdAt: schema.opportunities.createdAt,
        closedAt: schema.opportunities.closedAt
      })
      .from(schema.opportunities)
      .where(
        and(
          inArray(schema.opportunities.status, ["won", "lost"]),
          timestampStart ? gte(schema.opportunities.closedAt, timestampStart) : undefined,
          lt(schema.opportunities.closedAt, bounds.end)
        )
      ),
    db
      .select({ id: schema.opportunities.id, expectedValue: schema.opportunities.expectedValue })
      .from(schema.opportunities)
      .where(eq(schema.opportunities.status, "open"))
  ]);

  const convertedCount = leadRows.filter((row) => row.status === "converted").length;
  const disqualifiedCount = leadRows.filter((row) => row.status === "disqualified").length;
  const wonRows = opportunityClosedRows.filter((row) => row.status === "won");
  const lostRows = opportunityClosedRows.filter((row) => row.status === "lost");
  const opportunityRows = deduplicateById([...opportunityCreatedRows, ...opportunityClosedRows]);

  return {
    leads: {
      createdCount: leadRows.length,
      byStatus: countByStatus(leadRows),
      bySource: countLeadsBySource(leadRows),
      conversionRate: calculateRate(convertedCount, convertedCount + disqualifiedCount)
    },
    opportunities: {
      createdCount: opportunityCreatedRows.length,
      openPipelineCount: openOpportunityRows.length,
      openPipelineValue: openOpportunityRows.reduce((total, row) => total + Number(row.expectedValue), 0),
      wonCount: wonRows.length,
      lostCount: lostRows.length,
      wonValue: wonRows.reduce((total, row) => total + Number(row.expectedValue), 0),
      winRate: calculateRate(wonRows.length, wonRows.length + lostRows.length)
    },
    rows: [...leadRows.map(toCommercialLeadRow), ...opportunityRows.map(toCommercialOpportunityRow)]
  };
}

function toApprovalRow(
  approval: ApprovalReportQueryRow,
  event: OperationsReportEvent,
  eventDate: Date | null
): OperationsReportRow {
  return {
    entityId: approval.id,
    type: OPERATIONS_REPORT_ROW_TYPE.APPROVAL,
    event,
    code: approval.code,
    title: approval.title,
    status: approval.status,
    project: approval.projectName,
    eventDate,
    minutes: null,
    resolutionMinutes: null
  };
}

function toTicketRow(
  ticket: Pick<
    ResolvedTicketReportInput,
    "id" | "code" | "title" | "status" | "projectName"
  >,
  event: OperationsReportEvent,
  eventDate: Date,
  resolutionMinutes: number | null
): OperationsReportRow {
  return {
    entityId: ticket.id,
    type: OPERATIONS_REPORT_ROW_TYPE.TICKET,
    event,
    code: ticket.code,
    title: ticket.title,
    status: ticket.status,
    project: ticket.projectName,
    eventDate,
    minutes: null,
    resolutionMinutes
  };
}

function getTicketResolutionMinutes(
  ticket: Pick<ResolvedTicketReportInput, "resolutionStartedAt" | "resolvedAt">
): number | null {
  if (!ticket.resolutionStartedAt || !ticket.resolvedAt) {
    return null;
  }

  return (ticket.resolvedAt.getTime() - ticket.resolutionStartedAt.getTime()) / 60_000;
}

export function buildResolvedTicketReportData(
  tickets: readonly ResolvedTicketReportInput[]
): ResolvedTicketReportData {
  const durations: number[] = [];
  const rows = tickets.map((ticket) => {
    const duration = getTicketResolutionMinutes(ticket);

    if (duration !== null) {
      durations.push(duration);
    }

    return toTicketRow(
      ticket,
      OPERATIONS_REPORT_EVENT.TICKET_RESOLVED,
      ticket.resolvedAt,
      duration
    );
  });
  const totalResolutionMinutes = durations.reduce((total, duration) => total + duration, 0);

  return {
    rows,
    resolvedCycleCount: durations.length,
    averageResolutionMinutes: calculateRate(totalResolutionMinutes, durations.length)
  };
}

function requireResolvedTicket(row: TicketReportQueryRow): ResolvedTicketReportInput {
  if (row.resolvedAt === null) {
    throw new Error("Resolved ticket query returned a row without resolvedAt.");
  }

  return {
    id: row.id,
    code: row.code,
    title: row.title,
    status: row.status,
    resolutionStartedAt: row.resolutionStartedAt,
    resolvedAt: row.resolvedAt,
    projectName: row.projectName
  };
}

export async function getOperationsReport(period: ReportPeriod): Promise<OperationsReport> {
  const bounds = resolveReportPeriod(period);
  const timestampStart = bounds.start;

  const [projectRows, pendingApprovalRows, decidedApprovalRows, timeRows, createdTicketRows, resolvedTicketRows] = await Promise.all([
    db
      .select({
        id: schema.projects.id,
        code: schema.projects.code,
        name: schema.projects.name,
        status: schema.projects.status,
        estimatedHours: schema.projects.estimatedHours,
        createdAt: schema.projects.createdAt
      })
      .from(schema.projects),
    db
      .select({
        id: schema.approvals.id,
        code: schema.approvals.code,
        title: schema.approvals.title,
        status: schema.approvals.status,
        decidedAt: schema.approvals.decidedAt,
        projectName: schema.projects.name
      })
      .from(schema.approvals)
      .innerJoin(schema.projects, eq(schema.approvals.projectId, schema.projects.id))
      .where(eq(schema.approvals.status, APPROVAL_REPORT_STATUS.PENDING)),
    db
      .select({
        id: schema.approvals.id,
        code: schema.approvals.code,
        title: schema.approvals.title,
        status: schema.approvals.status,
        decidedAt: schema.approvals.decidedAt,
        projectName: schema.projects.name
      })
      .from(schema.approvals)
      .innerJoin(schema.projects, eq(schema.approvals.projectId, schema.projects.id))
      .where(
        and(
          inArray(schema.approvals.status, [
            APPROVAL_REPORT_STATUS.APPROVED,
            APPROVAL_REPORT_STATUS.CHANGES_REQUESTED
          ]),
          timestampStart ? gte(schema.approvals.decidedAt, timestampStart) : undefined,
          lt(schema.approvals.decidedAt, bounds.end)
        )
      ),
    db
      .select({
        id: schema.timeEntries.id,
        description: schema.timeEntries.description,
        startedAt: schema.timeEntries.startedAt,
        durationMinutes: schema.timeEntries.durationMinutes,
        projectId: schema.timeEntries.projectId,
        projectName: schema.projects.name,
        projectCode: schema.projects.code,
        projectEstimatedHours: schema.projects.estimatedHours
      })
      .from(schema.timeEntries)
      .leftJoin(schema.projects, eq(schema.timeEntries.projectId, schema.projects.id))
      .where(
        and(
          timestampStart ? gte(schema.timeEntries.startedAt, timestampStart) : undefined,
          lt(schema.timeEntries.startedAt, bounds.end)
        )
      ),
    db
      .select({
        id: schema.tickets.id,
        code: schema.tickets.code,
        title: schema.tickets.title,
        status: schema.tickets.status,
        createdAt: schema.tickets.createdAt,
        resolutionStartedAt: schema.tickets.resolutionStartedAt,
        resolvedAt: schema.tickets.resolvedAt,
        projectName: schema.projects.name
      })
      .from(schema.tickets)
      .leftJoin(schema.projects, eq(schema.tickets.projectId, schema.projects.id))
      .where(
        and(
          timestampStart ? gte(schema.tickets.createdAt, timestampStart) : undefined,
          lt(schema.tickets.createdAt, bounds.end)
        )
      ),
    db
      .select({
        id: schema.tickets.id,
        code: schema.tickets.code,
        title: schema.tickets.title,
        status: schema.tickets.status,
        createdAt: schema.tickets.createdAt,
        resolutionStartedAt: schema.tickets.resolutionStartedAt,
        resolvedAt: schema.tickets.resolvedAt,
        projectName: schema.projects.name
      })
      .from(schema.tickets)
      .leftJoin(schema.projects, eq(schema.tickets.projectId, schema.projects.id))
      .where(
        and(
          timestampStart ? gte(schema.tickets.resolvedAt, timestampStart) : undefined,
          lt(schema.tickets.resolvedAt, bounds.end)
        )
      )
  ]);

  const relatedProjectEstimates = new Map<string, number>();
  for (const row of timeRows) {
    if (row.projectId && row.projectEstimatedHours !== null && !relatedProjectEstimates.has(row.projectId)) {
      relatedProjectEstimates.set(row.projectId, Number(row.projectEstimatedHours));
    }
  }

  const resolvedTicketReportData = buildResolvedTicketReportData(
    resolvedTicketRows.map(requireResolvedTicket)
  );
  const projectCreatedRows = projectRows.filter((row) => isInTimestampPeriod(row.createdAt, bounds));

  const rows: OperationsReportRow[] = [
    ...projectCreatedRows.map((project) => ({
      entityId: project.id,
      type: OPERATIONS_REPORT_ROW_TYPE.PROJECT,
      event: OPERATIONS_REPORT_EVENT.PROJECT_CREATED,
      code: project.code,
      title: project.name,
      status: project.status,
      project: project.name,
      eventDate: project.createdAt,
      minutes: null,
      resolutionMinutes: null
    })),
    ...decidedApprovalRows.map((approval) =>
      toApprovalRow(approval, OPERATIONS_REPORT_EVENT.APPROVAL_DECIDED, approval.decidedAt)
    ),
    ...pendingApprovalRows.map((approval) =>
      toApprovalRow(approval, OPERATIONS_REPORT_EVENT.APPROVAL_PENDING_CURRENT, null)
    ),
    ...timeRows.map((entry) => ({
      entityId: entry.id,
      type: OPERATIONS_REPORT_ROW_TYPE.TIME_ENTRY,
      event: OPERATIONS_REPORT_EVENT.TIME_RECORDED,
      code: entry.projectCode,
      title: entry.description,
      status: null,
      project: entry.projectName,
      eventDate: entry.startedAt,
      minutes: entry.durationMinutes,
      resolutionMinutes: null
    })),
    ...createdTicketRows.map((ticket) =>
      toTicketRow(ticket, OPERATIONS_REPORT_EVENT.TICKET_CREATED, ticket.createdAt, null)
    ),
    ...resolvedTicketReportData.rows
  ];

  const approvedCount = decidedApprovalRows.filter(
    (row) => row.status === APPROVAL_REPORT_STATUS.APPROVED
  ).length;
  const changesRequestedCount = decidedApprovalRows.filter(
    (row) => row.status === APPROVAL_REPORT_STATUS.CHANGES_REQUESTED
  ).length;

  return {
    snapshot: {
      projectsByStatus: countByStatus(projectRows),
      pendingApprovalsCount: pendingApprovalRows.length
    },
    movement: {
      approvals: { approvedCount, changesRequestedCount },
      time: {
        registeredMinutes: timeRows.reduce((total, row) => total + row.durationMinutes, 0),
        relatedProjectsEstimatedHours: Array.from(relatedProjectEstimates.values()).reduce(
          (total, estimatedHours) => total + estimatedHours,
          0
        )
      },
      tickets: {
        createdCount: createdTicketRows.length,
        createdByStatus: countByStatus(createdTicketRows),
        resolvedCycleCount: resolvedTicketReportData.resolvedCycleCount,
        averageResolutionMinutes: resolvedTicketReportData.averageResolutionMinutes
      }
    },
    rows
  };
}

function isFinancialReportDirection(direction: string): direction is FinancialReportDirection {
  return (
    direction === FINANCIAL_REPORT_DIRECTION.IN || direction === FINANCIAL_REPORT_DIRECTION.OUT
  );
}

function toFinancialReportRow(entry: FinancialEntryRecord): FinancialReportRow {
  if (!isFinancialReportDirection(entry.direction)) {
    throw new Error(`Unsupported financial entry direction: ${entry.direction}`);
  }

  return {
    id: entry.id,
    code: entry.code,
    direction: entry.direction,
    type: entry.type,
    description: entry.description,
    status: entry.status,
    competenceDate: entry.competenceDate,
    dueDate: entry.dueDate,
    paidAt: entry.paidAt,
    expectedAmount: Number(entry.amountExpected),
    actualAmount: Number(entry.amountActual)
  };
}

export async function getFinancialReport(period: ReportPeriod): Promise<FinancialReport> {
  const bounds = resolveReportPeriod(period);
  const today = getCurrentLocalDayBounds(bounds.end).date;
  const timestampStart = bounds.start;

  const [dueRows, paidRows, overdueRows] = await Promise.all([
    db
      .select()
      .from(schema.financialEntries)
      .where(
        and(
          eq(schema.financialEntries.scope, "company"),
          bounds.startDate ? gte(schema.financialEntries.dueDate, bounds.startDate) : undefined,
          lte(schema.financialEntries.dueDate, bounds.endDate)
        )
      ),
    db
      .select()
      .from(schema.financialEntries)
      .where(
        and(
          eq(schema.financialEntries.scope, "company"),
          timestampStart ? gte(schema.financialEntries.paidAt, timestampStart) : undefined,
          lt(schema.financialEntries.paidAt, bounds.end)
        )
      ),
    db
      .select()
      .from(schema.financialEntries)
      .where(
        and(
          eq(schema.financialEntries.scope, "company"),
          lt(schema.financialEntries.dueDate, today),
          notInArray(schema.financialEntries.status, TERMINAL_FINANCIAL_STATUS)
        )
      )
  ]);

  const incomeExpected = dueRows
    .filter((row) => row.direction === FINANCIAL_REPORT_DIRECTION.IN)
    .reduce((total, row) => total + Number(row.amountExpected), 0);
  const expenseExpected = dueRows
    .filter((row) => row.direction === FINANCIAL_REPORT_DIRECTION.OUT)
    .reduce((total, row) => total + Number(row.amountExpected), 0);
  const incomeActual = paidRows
    .filter((row) => row.direction === FINANCIAL_REPORT_DIRECTION.IN)
    .reduce((total, row) => total + Number(row.amountActual), 0);
  const expenseActual = paidRows
    .filter((row) => row.direction === FINANCIAL_REPORT_DIRECTION.OUT)
    .reduce((total, row) => total + Number(row.amountActual), 0);
  const exportRows = deduplicateById([...dueRows, ...paidRows]);

  return {
    forecast: { incomeExpected, expenseExpected },
    actual: { incomeActual, expenseActual, result: incomeActual - expenseActual },
    overdue: {
      count: overdueRows.length,
      residualBalance: overdueRows.reduce(
        (total, row) =>
          total + calculateResidualBalance(Number(row.amountExpected), Number(row.amountActual)),
        0
      )
    },
    rows: exportRows.map(toFinancialReportRow)
  };
}
