import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@pulso/database/audit";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  serializeCommercialReportCsv,
  serializeFinancialReportCsv,
  serializeOperationsReportCsv
} from "@/lib/reports/csv";
import { REPORT_PERIOD, type ReportPeriod } from "@/lib/reports/constants";
import {
  getCommercialReport,
  getFinancialReport,
  getOperationsReport
} from "@/lib/reports/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const REPORT_EXPORT = {
  COMMERCIAL: "commercial",
  OPERATIONS: "operations",
  FINANCIAL: "financial"
} as const;

const exportQuerySchema = z.object({
  report: z.enum(REPORT_EXPORT),
  period: z.enum(REPORT_PERIOD)
});

type ReportExport = (typeof REPORT_EXPORT)[keyof typeof REPORT_EXPORT];

async function createReportCsv(report: ReportExport, period: ReportPeriod): Promise<string> {
  if (report === REPORT_EXPORT.COMMERCIAL) {
    return serializeCommercialReportCsv(await getCommercialReport(period));
  }

  if (report === REPORT_EXPORT.OPERATIONS) {
    return serializeOperationsReportCsv(await getOperationsReport(period));
  }

  return serializeFinancialReportCsv(await getFinancialReport(period));
}

function getExportFilename(report: ReportExport, period: ReportPeriod): string {
  return `relatorio-${report}-${period}.csv`;
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = exportQuerySchema.safeParse({
    report: url.searchParams.get("report"),
    period: url.searchParams.get("period")
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros de exportação inválidos." }, { status: 400 });
  }

  const { report, period } = parsed.data;
  const csv = await createReportCsv(report, period);

  await recordAuditEvent({
    actorType: "user",
    actorId: session.user.id,
    action: "report.exported",
    entityType: "report",
    entityId: report,
    after: { report, period }
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${getExportFilename(report, period)}"`,
      "Cache-Control": "private, no-store"
    }
  });
}
