import { describe, expect, it } from "vitest";
import {
  serializeCommercialReportCsv,
  serializeFinancialReportCsv,
  serializeOperationsReportCsv
} from "./csv";

describe("report CSV serialization", () => {
  it("serializes commercial rows with BOM, Portuguese headers, decimal commas and escaped text", () => {
    const csv = serializeCommercialReportCsv({
      leads: { createdCount: 0, byStatus: [], bySource: [], conversionRate: null },
      opportunities: {
        createdCount: 0,
        openPipelineCount: 0,
        openPipelineValue: 0,
        wonCount: 0,
        lostCount: 0,
        wonValue: 0,
        winRate: null
      },
      rows: [
        {
          id: "lead-1",
          type: "lead",
          code: "LEA-001",
          title: "=SOMA(1;1) \"cliente\"\nNovo",
          status: "new",
          source: "@evento",
          expectedValue: 1250.5,
          createdAt: new Date("2026-07-20T12:30:00.000Z"),
          closedAt: null
        }
      ]
    });

    expect(csv.startsWith("\uFEFF\"tipo\";\"codigo\";\"titulo\";\"status\";\"origem\";\"valor_esperado\";\"criado_em\";\"fechado_em\"\r\n")).toBe(true);
    expect(csv).toContain("\"'=SOMA(1;1) \"\"cliente\"\"\nNovo\"");
    expect(csv).toContain("\"'@evento\"");
    expect(csv).toContain("\"1250,50\"");
    expect(csv).toContain("\"20/07/2026\"");
    expect(csv).toContain("\"\"");
  });

  it("prefixes every dangerous text formula prefix before CSV escaping", () => {
    const csv = serializeCommercialReportCsv({
      leads: { createdCount: 0, byStatus: [], bySource: [], conversionRate: null },
      opportunities: {
        createdCount: 0,
        openPipelineCount: 0,
        openPipelineValue: 0,
        wonCount: 0,
        lostCount: 0,
        wonValue: 0,
        winRate: null
      },
      rows: [
        {
          id: "lead-1",
          type: "lead",
          code: "+CODE",
          title: "-Title",
          status: "@status",
          source: "=source",
          expectedValue: null,
          createdAt: new Date("2026-07-20T12:30:00.000Z"),
          closedAt: null
        }
      ]
    });

    expect(csv).toContain("\"'+CODE\";\"'-Title\";\"'@status\";\"'=source\"");
  });

  it("uses the operational headers and formats event data", () => {
    const csv = serializeOperationsReportCsv({
      snapshot: { projectsByStatus: [], pendingApprovalsCount: 0 },
      movement: {
        approvals: { approvedCount: 0, changesRequestedCount: 0 },
        time: { registeredMinutes: 0, relatedProjectsEstimatedHours: 0 },
        tickets: {
          createdCount: 0,
          createdByStatus: [],
          resolvedCycleCount: 0,
          averageResolutionMinutes: null
        }
      },
      rows: [
        {
          entityId: "ticket-1",
          type: "ticket",
          event: "chamado_resolvido",
          code: "CHA-001",
          title: "Chamado; prioritário",
          status: "resolved",
          project: "Projeto A",
          eventDate: new Date("2026-07-20T12:30:00.000Z"),
          minutes: 30,
          resolutionMinutes: 45
        }
      ]
    });

    expect(csv.startsWith("\uFEFF\"tipo\";\"evento\";\"codigo\";\"titulo\";\"status\";\"projeto\";\"data_evento\";\"minutos\";\"tempo_resolucao_minutos\"\r\n")).toBe(true);
    expect(csv).toContain("\"Chamado; prioritário\"");
    expect(csv).toContain("\"30\";\"45\"");
  });

  it("uses financial headers, formats date-only values and does not divide decimal amounts", () => {
    const csv = serializeFinancialReportCsv({
      forecast: { incomeExpected: 0, expenseExpected: 0 },
      actual: { incomeActual: 0, expenseActual: 0, result: 0 },
      overdue: { count: 0, residualBalance: 0 },
      rows: [
        {
          id: "entry-1",
          code: "FIN-001",
          direction: "in",
          type: "service",
          description: "Receita",
          status: "paid",
          competenceDate: "2026-07-01",
          dueDate: "2026-07-15",
          paidAt: new Date("2026-07-18T15:30:00.000Z"),
          expectedAmount: 99.9,
          actualAmount: 99.9
        }
      ]
    });

    expect(csv.startsWith("\uFEFF\"codigo\";\"direcao\";\"tipo\";\"descricao\";\"status\";\"competencia\";\"vencimento\";\"pagamento\";\"valor_previsto\";\"valor_realizado\"\r\n")).toBe(true);
    expect(csv).toContain("\"01/07/2026\";\"15/07/2026\";\"18/07/2026\";\"99,90\";\"99,90\"");
  });
});
