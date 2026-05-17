import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { VecTrade } from "../src/client";
import { RequestAbortedError, TimeoutError } from "../src/errors";

const BASE = "https://api.vectrade.io/v1";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("client.request() – AbortSignal support", () => {
  it("throws RequestAbortedError when signal is already aborted", async () => {
    server.use(http.get(`${BASE}/test`, () => HttpResponse.json({ ok: true })));
    const client = new VecTrade({ apiKey: "vq_test_key12345678901", maxRetries: 0 });
    const controller = new AbortController();
    controller.abort();

    await expect(
      client.request("GET", "/test", { signal: controller.signal })
    ).rejects.toBeInstanceOf(RequestAbortedError);
  });

  it("throws RequestAbortedError when signal fires mid-flight", async () => {
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
    setTimeout(() => controller.abort(), 50);

    await expect(promise).rejects.toBeInstanceOf(RequestAbortedError);
  });
});

describe("client.request() – TimeoutError", () => {
  it("throws TimeoutError when request exceeds timeout", async () => {
    server.use(
      http.get(`${BASE}/timeout`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ ok: true });
      })
    );
    const client = new VecTrade({
      apiKey: "vq_test_key12345678901",
      maxRetries: 0,
      timeout: 50,
    });

    await expect(client.request("GET", "/timeout")).rejects.toBeInstanceOf(TimeoutError);
  });

  it("TimeoutError includes method and path info", async () => {
    server.use(
      http.get(`${BASE}/slow-endpoint`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ ok: true });
      })
    );
    const client = new VecTrade({
      apiKey: "vq_test_key12345678901",
      maxRetries: 0,
      timeout: 50,
    });

    try {
      await client.request("GET", "/slow-endpoint");
    } catch (e) {
      expect(e).toBeInstanceOf(TimeoutError);
      expect((e as TimeoutError).message).toContain("GET");
      expect((e as TimeoutError).message).toContain("/slow-endpoint");
    }
  });
});
