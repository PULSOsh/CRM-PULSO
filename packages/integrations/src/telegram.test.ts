import { describe, it, expect, vi } from "vitest";
import { HttpTelegramProvider } from "./telegram";

describe("HttpTelegramProvider", () => {
  it("should parse getMe response correctly", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          id: 123456,
          is_bot: true,
          first_name: "TestBot",
          username: "test_bot"
        }
      })
    });

    const provider = new HttpTelegramProvider({ botToken: "test:token", fetchFn: mockFetch as any });
    const me = await provider.getMe();
    
    expect(me.id).toBe(123456);
    expect(me.is_bot).toBe(true);
    expect(me.first_name).toBe("TestBot");
    expect(mockFetch).toHaveBeenCalledWith("https://api.telegram.org/bottest:token/getMe", expect.any(Object));
  });

  it("should throw error on API error response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: false,
        error_code: 401,
        description: "Unauthorized"
      })
    });

    const provider = new HttpTelegramProvider({ botToken: "test:token", fetchFn: mockFetch as any });
    await expect(provider.getMe()).rejects.toThrow("Telegram API Error 401: Unauthorized");
  });

  it("should handle timeout", async () => {
    const mockFetch = vi.fn().mockImplementation(() => new Promise((_, reject) => {
      const err = new Error("AbortError");
      err.name = "AbortError";
      reject(err);
    }));

    const provider = new HttpTelegramProvider({ botToken: "test:token", fetchFn: mockFetch as any });
    await expect(provider.getMe()).rejects.toThrow("Telegram API Error: Request timed out");
  });

  it("should parse sendMessage response correctly", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          message_id: 999
        }
      })
    });

    const provider = new HttpTelegramProvider({ botToken: "test:token", fetchFn: mockFetch as any });
    const res = await provider.sendMessage({ chat_id: "123", text: "Hello" });
    
    expect(res.message_id).toBe(999);
    expect(mockFetch).toHaveBeenCalledWith("https://api.telegram.org/bottest:token/sendMessage", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ chat_id: "123", text: "Hello" })
    }));
  });
});
