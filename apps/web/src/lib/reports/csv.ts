import type {
  CommercialReport,
  FinancialReport,
  OperationsReport
} from "./queries";

const UTF8_BOM = "\uFEFF";
const CSV_SEPARATOR = ";";
const CSV_LINE_BREAK = "\r\n";
const FORMULA_PREFIXES = ["=", "+", "-", "@"] as const;

const COMMERCIAL_CSV_HEADERS = [
  "tipo",
  "codigo",
  "titulo",
  "status",
  "origem",
  "valor_esperado",
  "criado_em",
  "fechado_em"
] as const;

const OPERATIONS_CSV_HEADERS = [
  "tipo",
  "evento",
  "codigo",
  "titulo",
  "status",
  "projeto",
  "data_evento",
  "minutos",
  "tempo_resolucao_minutos"
] as const;

const FINANCIAL_CSV_HEADERS = [
  "codigo",
  "direcao",
  "tipo",
  "descricao",
  "status",
  "competencia",
  "vencimento",
  "pagamento",
  "valor_previsto",
  "valor_realizado"
] as const;

function escapeCsvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function sanitizeCsvText(value: string): string {
  return FORMULA_PREFIXES.some((prefix) => value.startsWith(prefix)) ? `'${value}` : value;
}

function formatText(value: string | null): string {
  return escapeCsvCell(sanitizeCsvText(value ?? ""));
}

function formatNumber(value: number | null): string {
  return escapeCsvCell(value === null ? "" : String(value));
}

function formatCurrency(value: number | null): string {
  return escapeCsvCell(value === null ? "" : value.toFixed(2).replace(".", ","));
}

function formatDateParts(year: string, month: string, day: string): string {
  return `${day}/${month}/${year}`;
}

function formatReportDate(value: Date | string | null): string {
  if (value === null) {
    return "";
  }

  if (typeof value === "string") {
    const [year, month, day] = value.split("-");
    return year && month && day ? formatDateParts(year, month, day) : value;
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Fortaleza",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).formatToParts(value);
  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;

  return day && month && year ? formatDateParts(year, month, day) : "";
}

function serializeCsv(headers: readonly string[], rows: readonly string[][]): string {
  const serializedHeaders = headers.map((header) => escapeCsvCell(header)).join(CSV_SEPARATOR);
  const serializedRows = rows.map((row) => row.join(CSV_SEPARATOR));

  return `${UTF8_BOM}${[serializedHeaders, ...serializedRows].join(CSV_LINE_BREAK)}${CSV_LINE_BREAK}`;
}

export function serializeCommercialReportCsv(report: CommercialReport): string {
  const rows = report.rows.map((row) => [
    formatText(row.type),
    formatText(row.code),
    formatText(row.title),
    formatText(row.status),
    formatText(row.source),
    formatCurrency(row.expectedValue),
    escapeCsvCell(formatReportDate(row.createdAt)),
    escapeCsvCell(formatReportDate(row.closedAt))
  ]);

  return serializeCsv(COMMERCIAL_CSV_HEADERS, rows);
}

export function serializeOperationsReportCsv(report: OperationsReport): string {
  const rows = report.rows.map((row) => [
    formatText(row.type),
    formatText(row.event),
    formatText(row.code),
    formatText(row.title),
    formatText(row.status),
    formatText(row.project),
    escapeCsvCell(formatReportDate(row.eventDate)),
    formatNumber(row.minutes),
    formatNumber(row.resolutionMinutes)
  ]);

  return serializeCsv(OPERATIONS_CSV_HEADERS, rows);
}

export function serializeFinancialReportCsv(report: FinancialReport): string {
  const rows = report.rows.map((row) => [
    formatText(row.code),
    formatText(row.direction),
    formatText(row.type),
    formatText(row.description),
    formatText(row.status),
    escapeCsvCell(formatReportDate(row.competenceDate)),
    escapeCsvCell(formatReportDate(row.dueDate)),
    escapeCsvCell(formatReportDate(row.paidAt)),
    formatCurrency(row.expectedAmount),
    formatCurrency(row.actualAmount)
  ]);

  return serializeCsv(FINANCIAL_CSV_HEADERS, rows);
}
