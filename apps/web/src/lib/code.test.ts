import { describe, expect, it } from "vitest";
import { formatRecordCode } from "./code";

describe("formatRecordCode", () => {
  it("gera códigos legíveis", () => {
    expect(formatRecordCode("proposal", 2026, 12)).toBe("PROP-2026-0012");
  });
});
