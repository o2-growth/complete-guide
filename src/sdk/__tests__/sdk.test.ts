import { describe, it, expect, vi, beforeEach } from "vitest";
import { OxyClient } from "../index";

describe("OxyClient", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("envia X-API-Key no header", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    const client = new OxyClient({ apiKey: "oxy_test_123" });
    await client.ping();
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)["X-API-Key"]).toBe("oxy_test_123");
  });

  it("monta querystring para tasks.list", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    );
    const client = new OxyClient({ apiKey: "k" });
    await client.tasks.list({ limit: 50, offset: 10 });
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("/tasks?limit=50&offset=10");
  });

  it("lança erro em status >= 400", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("forbidden", { status: 403, statusText: "Forbidden" })
    );
    const client = new OxyClient({ apiKey: "k" });
    await expect(client.ping()).rejects.toThrow(/403/);
  });
});
