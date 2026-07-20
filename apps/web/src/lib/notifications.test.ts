import { describe, it, expect } from "vitest";
import { generateEventKey } from "./notifications";

describe("generateEventKey", () => {
  it("should generate a simple key", () => {
    expect(generateEventKey("test", "123")).toBe("test:123");
  });

  it("should truncate and hash a very long key", () => {
    const longPart = "a".repeat(200);
    const key = generateEventKey("prefix", longPart);
    expect(key.length).toBeLessThanOrEqual(180);
    expect(key.startsWith("prefix:")).toBe(true);
    expect(key).toMatch(/^[a-z0-9:-]+$/i);
  });
});
