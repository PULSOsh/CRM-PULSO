export const REPORT_PERIOD = {
  THIRTY_DAYS: "30d",
  NINETY_DAYS: "90d",
  YEAR: "year",
  ALL: "all"
} as const;

export type ReportPeriod = (typeof REPORT_PERIOD)[keyof typeof REPORT_PERIOD];

export const REPORT_TIME_ZONE = "America/Fortaleza" as const;

export const COMMERCIAL_REPORT_ROW_TYPE = {
  LEAD: "lead",
  OPPORTUNITY: "opportunity"
} as const;

export type CommercialReportRowType =
  (typeof COMMERCIAL_REPORT_ROW_TYPE)[keyof typeof COMMERCIAL_REPORT_ROW_TYPE];

export const OPERATIONS_REPORT_ROW_TYPE = {
  PROJECT: "project",
  APPROVAL: "approval",
  TIME_ENTRY: "time_entry",
  TICKET: "ticket"
} as const;

export type OperationsReportRowType =
  (typeof OPERATIONS_REPORT_ROW_TYPE)[keyof typeof OPERATIONS_REPORT_ROW_TYPE];

export const OPERATIONS_REPORT_EVENT = {
  PROJECT_CREATED: "projeto_criado",
  APPROVAL_DECIDED: "aprovacao_decidida",
  APPROVAL_PENDING_CURRENT: "aprovacao_pendente_atual",
  TIME_RECORDED: "horas_registradas",
  TICKET_CREATED: "chamado_criado",
  TICKET_RESOLVED: "chamado_resolvido"
} as const;

export type OperationsReportEvent =
  (typeof OPERATIONS_REPORT_EVENT)[keyof typeof OPERATIONS_REPORT_EVENT];

export const APPROVAL_REPORT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  CHANGES_REQUESTED: "changes_requested"
} as const;

export const FINANCIAL_REPORT_DIRECTION = {
  IN: "in",
  OUT: "out"
} as const;

export type FinancialReportDirection =
  (typeof FINANCIAL_REPORT_DIRECTION)[keyof typeof FINANCIAL_REPORT_DIRECTION];
