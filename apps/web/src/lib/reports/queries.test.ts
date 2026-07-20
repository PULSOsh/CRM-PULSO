import { describe, expect, it } from "vitest";
import {
  buildResolvedTicketReportData,
  calculateRate,
  calculateResidualBalance,
  deduplicateById
} from "./queries";

describe("report query helpers", () => {
  it("retorna null quando uma taxa n\u00e3o tem denominador", () => {
    expect(calculateRate(0, 0)).toBeNull();
  });

  it("calcula a propor\u00e7\u00e3o correta", () => {
    expect(calculateRate(3, 4)).toBe(0.75);
  });

  it("deduplica linhas por id preservando a primeira ocorr\u00eancia", () => {
    const rows = [
      { id: "first", value: "original" },
      { id: "second", value: "other" },
      { id: "first", value: "duplicate" }
    ];

    expect(deduplicateById(rows)).toEqual([
      { id: "first", value: "original" },
      { id: "second", value: "other" }
    ]);
  });

  it("calcula somente o saldo residual positivo", () => {
    expect(calculateResidualBalance(100, 35)).toBe(65);
    expect(calculateResidualBalance(100, 125)).toBe(0);
  });

  it("exporta chamado resolvido legado sem inventar dura\u00e7\u00e3o nem inclu\u00ed-lo na m\u00e9dia", () => {
    const resolvedAt = new Date("2026-07-20T12:00:00.000Z");
    const result = buildResolvedTicketReportData([
      {
        id: "legacy-ticket",
        code: "CHA-001",
        title: "Chamado legado",
        status: "resolved",
        resolutionStartedAt: null,
        resolvedAt,
        projectName: null
      },
      {
        id: "measurable-ticket",
        code: "CHA-002",
        title: "Chamado mensur\u00e1vel",
        status: "closed",
        resolutionStartedAt: new Date("2026-07-20T11:00:00.000Z"),
        resolvedAt,
        projectName: "Projeto"
      }
    ]);

    expect(result.rows).toHaveLength(2);
    expect(result.rows.find((row) => row.entityId === "legacy-ticket")).toMatchObject({
      entityId: "legacy-ticket",
      event: "chamado_resolvido",
      eventDate: resolvedAt,
      resolutionMinutes: null
    });
    expect(result.resolvedCycleCount).toBe(1);
    expect(result.averageResolutionMinutes).toBe(60);
  });
});
