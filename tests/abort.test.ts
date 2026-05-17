import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { VecTrade } from "../src/client";

const BASE = "https://api.vectrade.io/v1";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("client.request() – AbortSignal support", () => {
  it("aborts request when signal is already aborted", async () => {
    server.use(http.get(`${BASE}/test`, () => HttpResponse.json({ ok: true })));
    const client = new VecTrade({ apiKey: "vq_test_key12345678901", maxRetries: 0 });
    const controller = new AbortController();
    controller.abort();

    await expect(client.request("GET", "/test", { signal: controller.signal })).rejects.toThrow();
  });

  it("aborts in-flight request when signal fires", async () => {
    server.use(
      http.get(`${BASE}/slow`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ ok: true });
      })
    );
    const client = new VecTrade({
      apiKey: "vq_test_key12345678901",
      maxRetries: 0,
      timeout: 10000,
    });
    const controller = new AbortController();

    const promise = client.request("GET", "/slow", { signal: controller.signal });
    // Abort after a brief delay
    setTimeout(() => controller.abort(), 50);

    await expect(promise).rejects.toThrow();
  });
});
