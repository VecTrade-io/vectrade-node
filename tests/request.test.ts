import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { VecTrade } from "../src/client";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  APIError,
} from "../src/errors";

const BASE = "https://api.vectrade.io/v1";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeClient(overrides: { maxRetries?: number; timeout?: number } = {}) {
  return new VecTrade({ apiKey: "vq_test_key12345678901", ...overrides });
}

describe("client.request() – error mapping", () => {
  it("maps 401 to AuthenticationError", async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.json(
          { error: { message: "Invalid API key" } },
          { status: 401, headers: { "x-request-id": "req_401" } }
        )
      )
    );
    const client = makeClient({ maxRetries: 0 });
    await expect(client.request("GET", "/test")).rejects.toThrow(AuthenticationError);
    try {
      await client.request("GET", "/test");
    } catch (e) {
      expect((e as AuthenticationError).status).toBe(401);
      expect((e as AuthenticationError).requestId).toBe("req_401");
    }
  });

  it("maps 403 to AuthenticationError", async () => {
    server.use(http.get(`${BASE}/test`, () => HttpResponse.text("Forbidden", { status: 403 })));
    const client = makeClient({ maxRetries: 0 });
    await expect(client.request("GET", "/test")).rejects.toThrow(AuthenticationError);
  });

  it("maps 404 to NotFoundError", async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.json(
          { error: { message: "Not found" } },
          { status: 404, headers: { "x-request-id": "req_nf" } }
        )
      )
    );
    const client = makeClient({ maxRetries: 0 });
    await expect(client.request("GET", "/test")).rejects.toThrow(NotFoundError);
  });

  it("maps 422 to ValidationError", async () => {
    server.use(
      http.post(`${BASE}/test`, () =>
        HttpResponse.json({ error: { message: "Invalid params" } }, { status: 422 })
      )
    );
    const client = makeClient({ maxRetries: 0 });
    await expect(client.request("POST", "/test", { body: JSON.stringify({}) })).rejects.toThrow(
      ValidationError
    );
  });

  it("maps 429 to RateLimitError with retryAfter", async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.text("Rate limited", {
          status: 429,
          headers: { "Retry-After": "3.5" },
        })
      )
    );
    const client = makeClient({ maxRetries: 0 });
    try {
      await client.request("GET", "/test");
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      expect((e as RateLimitError).retryAfter).toBe(3.5);
    }
  });

  it("maps 500 to ServerError", async () => {
    server.use(
      http.get(`${BASE}/test`, () => HttpResponse.text("Internal Server Error", { status: 500 }))
    );
    const client = makeClient({ maxRetries: 0 });
    await expect(client.request("GET", "/test")).rejects.toThrow(ServerError);
  });

  it("maps 503 to ServerError", async () => {
    server.use(
      http.get(`${BASE}/test`, () => HttpResponse.text("Service Unavailable", { status: 503 }))
    );
    const client = makeClient({ maxRetries: 0 });
    await expect(client.request("GET", "/test")).rejects.toThrow(ServerError);
  });

  it("maps unknown 4xx to APIError", async () => {
    server.use(http.get(`${BASE}/test`, () => HttpResponse.text("Teapot", { status: 418 })));
    const client = makeClient({ maxRetries: 0 });
    await expect(client.request("GET", "/test")).rejects.toThrow(APIError);
    try {
      await client.request("GET", "/test");
    } catch (e) {
      expect((e as APIError).status).toBe(418);
    }
  });
});

describe("client.request() – retry behavior", () => {
  it("retries on 429 then succeeds", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/test`, () => {
        calls++;
        if (calls === 1) {
          return HttpResponse.text("Rate limited", { status: 429 });
        }
        return HttpResponse.json({ ok: true });
      })
    );
    const client = makeClient({ maxRetries: 2 });
    const result = await client.request<{ ok: boolean }>("GET", "/test");
    expect(result.ok).toBe(true);
    expect(calls).toBe(2);
  });

  it("retries on 500 then succeeds", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/test`, () => {
        calls++;
        if (calls === 1) {
          return HttpResponse.text("Error", { status: 500 });
        }
        return HttpResponse.json({ ok: true });
      })
    );
    const client = makeClient({ maxRetries: 2 });
    const result = await client.request<{ ok: boolean }>("GET", "/test");
    expect(result.ok).toBe(true);
    expect(calls).toBe(2);
  });

  it("does not retry on 404", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/test`, () => {
        calls++;
        return HttpResponse.json({ error: "not found" }, { status: 404 });
      })
    );
    const client = makeClient({ maxRetries: 3 });
    await expect(client.request("GET", "/test")).rejects.toThrow(NotFoundError);
    expect(calls).toBe(1);
  });

  it("throws after exhausting retries on 500", async () => {
    server.use(http.get(`${BASE}/test`, () => HttpResponse.text("Error", { status: 500 })));
    const client = makeClient({ maxRetries: 1 });
    await expect(client.request("GET", "/test")).rejects.toThrow(ServerError);
  });
});

describe("client.request() – idempotency key", () => {
  it("sends Idempotency-Key header when provided", async () => {
    let receivedKey: string | null = null;
    server.use(
      http.post(`${BASE}/test`, ({ request }) => {
        receivedKey = request.headers.get("idempotency-key");
        return HttpResponse.json({ ok: true });
      })
    );
    const client = makeClient({ maxRetries: 0 });
    await client.request("POST", "/test", {
      body: JSON.stringify({}),
      idempotencyKey: "idem_test_123",
    });
    expect(receivedKey).toBe("idem_test_123");
  });

  it("does not send Idempotency-Key when not set", async () => {
    let receivedKey: string | null = "should-be-null";
    server.use(
      http.get(`${BASE}/test`, ({ request }) => {
        receivedKey = request.headers.get("idempotency-key");
        return HttpResponse.json({ ok: true });
      })
    );
    const client = makeClient({ maxRetries: 0 });
    await client.request("GET", "/test");
    expect(receivedKey).toBeNull();
  });
});

describe("client.request() – response metadata", () => {
  it("captures lastResponseMeta from headers", async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.json(
          { data: "ok" },
          {
            headers: {
              "x-request-id": "req_meta_123",
              "x-vq-ratelimit-remaining": "42",
            },
          }
        )
      )
    );
    const client = makeClient({ maxRetries: 0 });
    await client.request("GET", "/test");
    expect(client.lastResponseMeta).toEqual({
      requestId: "req_meta_123",
      rateLimitRemaining: 42,
      rateLimitReset: undefined,
      retries: 0,
    });
  });

  it("handles missing metadata headers gracefully", async () => {
    server.use(http.get(`${BASE}/test`, () => HttpResponse.json({ data: "ok" })));
    const client = makeClient({ maxRetries: 0 });
    await client.request("GET", "/test");
    expect(client.lastResponseMeta?.requestId).toBeUndefined();
    expect(client.lastResponseMeta?.rateLimitRemaining).toBeUndefined();
  });
});

describe("client.request() – successful request", () => {
  it("returns parsed JSON on 200", async () => {
    server.use(http.get(`${BASE}/test`, () => HttpResponse.json({ symbol: "AAPL", price: 195 })));
    const client = makeClient({ maxRetries: 0 });
    const data = await client.request<{ symbol: string; price: number }>("GET", "/test");
    expect(data.symbol).toBe("AAPL");
    expect(data.price).toBe(195);
  });

  it("sends Authorization header", async () => {
    let authHeader: string | null = null;
    server.use(
      http.get(`${BASE}/test`, ({ request }) => {
        authHeader = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      })
    );
    const client = makeClient({ maxRetries: 0 });
    await client.request("GET", "/test");
    expect(authHeader).toBe("Bearer vq_test_key12345678901");
  });
});
