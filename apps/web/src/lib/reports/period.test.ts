import { describe, expect, it } from "vitest";
import { REPORT_PERIOD } from "./constants";
import {
  getCurrentLocalDayBounds,
  getReportPeriodOrDefault,
  isReportPeriod,
  parseReportPeriod,
  resolveReportPeriod
} from "./period";

const FORTALEZA_EVENING_IN_UTC = new Date("2026-07-20T01:30:00.000Z");

describe("report periods", () => {
  it("distingue valores de per\u00edodo v\u00e1lidos de entradas inv\u00e1lidas", () => {
    expect(isReportPeriod(REPORT_PERIOD.THIRTY_DAYS)).toBe(true);
    expect(isReportPeriod("14d")).toBe(false);
    expect(isReportPeriod(null)).toBe(false);
    expect(parseReportPeriod("90d")).toBe(REPORT_PERIOD.NINETY_DAYS);
    expect(parseReportPeriod("invalid")).toBeNull();
    expect(getReportPeriodOrDefault("invalid")).toBe(REPORT_PERIOD.THIRTY_DAYS);
  });

  it("resolve os \u00faltimos 30 dias-calend\u00e1rio de Fortaleza", () => {
    const period = resolveReportPeriod(REPORT_PERIOD.THIRTY_DAYS, FORTALEZA_EVENING_IN_UTC);

    expect(period.start?.toISOString()).toBe("2026-06-20T03:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-07-20T01:30:00.000Z");
    expect(period.startDate).toBe("2026-06-20");
    expect(period.endDate).toBe("2026-07-19");
  });

  it("resolve os \u00faltimos 90 dias-calend\u00e1rio de Fortaleza", () => {
    const period = resolveReportPeriod(REPORT_PERIOD.NINETY_DAYS, FORTALEZA_EVENING_IN_UTC);

    expect(period.start?.toISOString()).toBe("2026-04-21T03:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-07-20T01:30:00.000Z");
    expect(period.startDate).toBe("2026-04-21");
    expect(period.endDate).toBe("2026-07-19");
  });

  it("inicia o ano na meia-noite local mesmo na virada vista em UTC", () => {
    const now = new Date("2026-01-01T02:30:00.000Z");
    const period = resolveReportPeriod(REPORT_PERIOD.YEAR, now);

    expect(period.start?.toISOString()).toBe("2025-01-01T03:00:00.000Z");
    expect(period.end).toBe(now);
    expect(period.startDate).toBe("2025-01-01");
    expect(period.endDate).toBe("2025-12-31");
  });

  it("mant\u00e9m todo o hist\u00f3rico sem limite inicial", () => {
    const period = resolveReportPeriod(REPORT_PERIOD.ALL, FORTALEZA_EVENING_IN_UTC);

    expect(period.start).toBeNull();
    expect(period.end).toBe(FORTALEZA_EVENING_IN_UTC);
    expect(period.startDate).toBeNull();
    expect(period.endDate).toBe("2026-07-19");
  });

  it("calcula o dia local atual sem depender do timezone do processo", () => {
    const bounds = getCurrentLocalDayBounds(new Date("2026-07-20T03:30:00.000Z"));

    expect(bounds.date).toBe("2026-07-20");
    expect(bounds.start.toISOString()).toBe("2026-07-20T03:00:00.000Z");
    expect(bounds.end.toISOString()).toBe("2026-07-21T03:00:00.000Z");
  });

  it("usa in\u00edcio inclusivo e fim exclusivo para timestamps", () => {
    const period = resolveReportPeriod(REPORT_PERIOD.THIRTY_DAYS, FORTALEZA_EVENING_IN_UTC);
    const start = period.start;

    expect(start).not.toBeNull();
    expect(start!.toISOString()).toBe("2026-06-20T03:00:00.000Z");
    expect(new Date(start!.getTime() - 1).toISOString()).toBe("2026-06-20T02:59:59.999Z");
    expect(period.end.toISOString()).toBe("2026-07-20T01:30:00.000Z");
  });
});
