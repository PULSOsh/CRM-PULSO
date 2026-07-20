import { describe, it, expect } from "vitest";
import { parseTelegramCommand, TELEGRAM_COMMAND } from "./commands";

describe("parseTelegramCommand", () => {
  it("should parse /ajuda", () => {
    expect(parseTelegramCommand("/ajuda")).toEqual({ type: TELEGRAM_COMMAND.HELP });
    expect(parseTelegramCommand("  /ajuda  ")).toEqual({ type: TELEGRAM_COMMAND.HELP });
  });

  it("should parse /hoje", () => {
    expect(parseTelegramCommand("/hoje")).toEqual({ type: TELEGRAM_COMMAND.TODAY });
  });

  it("should parse /cancelar", () => {
    expect(parseTelegramCommand("/cancelar")).toEqual({ type: TELEGRAM_COMMAND.CANCEL });
  });

  it("should parse /buscar", () => {
    expect(parseTelegramCommand("/buscar pulso")).toEqual({ type: TELEGRAM_COMMAND.SEARCH, term: "pulso" });
    expect(parseTelegramCommand("/buscar ")).toMatchObject({ type: "unknown" });
    expect(parseTelegramCommand("/buscar a")).toMatchObject({ type: "unknown" });
  });

  it("should parse /nota", () => {
    expect(parseTelegramCommand("/nota Reunião remarcada para amanhã")).toEqual({ type: TELEGRAM_COMMAND.NOTE, summary: "Reunião remarcada para amanhã" });
    expect(parseTelegramCommand("/nota ")).toMatchObject({ type: "unknown" });
  });

  it("should parse /tarefa with valid date", () => {
    const res = parseTelegramCommand("/tarefa 25/12/2026 14:30 Preparar relatório anual");
    expect(res.type).toBe(TELEGRAM_COMMAND.TASK);
    if (res.type === TELEGRAM_COMMAND.TASK) {
      expect(res.title).toBe("Preparar relatório anual");
      // 25/12/2026 14:30 BRT (UTC-3) = 25/12/2026 17:30 UTC
      expect(res.dueAt.toISOString()).toBe("2026-12-25T17:30:00.000Z");
    }
  });

  it("should reject /tarefa with invalid dates", () => {
    expect(parseTelegramCommand("/tarefa 32/12/2026 14:30 Test")).toMatchObject({ type: "unknown" });
    expect(parseTelegramCommand("/tarefa 25/13/2026 14:30 Test")).toMatchObject({ type: "unknown" });
    expect(parseTelegramCommand("/tarefa 25/12/2026 25:30 Test")).toMatchObject({ type: "unknown" });
    expect(parseTelegramCommand("/tarefa 25/12/2026 14:60 Test")).toMatchObject({ type: "unknown" });
    expect(parseTelegramCommand("/tarefa hoje 14:30 Test")).toMatchObject({ type: "unknown" });
  });

  it("should handle unknown commands", () => {
    expect(parseTelegramCommand("/unknown")).toMatchObject({ type: "unknown" });
    expect(parseTelegramCommand("just some text")).toMatchObject({ type: "unknown" });
  });
});
