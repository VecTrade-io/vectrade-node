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
  QuotaExceededError,
  PaymentRequiredError,
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

  it("sends X-API-Key header", async () => {
    let apiKeyHeader: string | null = null;
    server.use(
      http.get(`${BASE}/test`, ({ request }) => {
        apiKeyHeader = request.headers.get("x-api-key");
        return HttpResponse.json({ ok: true });
      })
    );
    const client = makeClient({ maxRetries: 0 });
    await client.request("GET", "/test");
    expect(apiKeyHeader).toBe("vq_test_key12345678901");
  });
});

describe("client.request() – auth gateway error format", () => {
  it("parses auth gateway 401 format", async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.json(
          {
            error: "authentication_required",
            message: "API key is required. Include your key in the X-API-Key header.",
            docs_url: "https://docs.vectrade.io/guides/authentication",
            dashboard_url: "https://vectrade.io/vtrade/developer",
          },
          { status: 401 }
        )
      )
    );
    const client = makeClient({ maxRetries: 0 });
    try {
      await client.request("GET", "/test");
    } catch (e) {
      expect(e).toBeInstanceOf(AuthenticationError);
      expect((e as AuthenticationError).message).toContain("API key is required");
      expect((e as AuthenticationError).errorCode).toBe("authentication_required");
    }
  });

  it("parses auth gateway 403 invalid_api_key", async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.json(
          {
            error: "invalid_api_key",
            message: "The provided API key is invalid, expired, or has been revoked.",
            docs_url: "https://docs.vectrade.io/guides/authentication",
            dashboard_url: "https://vectrade.io/vtrade/developer",
          },
          { status: 403 }
        )
      )
    );
    const client = makeClient({ maxRetries: 0 });
    try {
      await client.request("GET", "/test");
    } catch (e) {
      expect(e).toBeInstanceOf(AuthenticationError);
      expect((e as AuthenticationError).errorCode).toBe("invalid_api_key");
    }
  });

  it("maps 403 ai_access_denied to PaymentRequiredError", async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.json(
          {
            error: "ai_access_denied",
            message: "AI features are not available on the Free plan.",
            plan: "Free",
            upgrade_url: "https://vectrade.io/vtrade/developer",
          },
          { status: 403 }
        )
      )
    );
    const client = makeClient({ maxRetries: 0 });
    try {
      await client.request("GET", "/test");
    } catch (e) {
      expect(e).toBeInstanceOf(PaymentRequiredError);
      expect((e as PaymentRequiredError).errorCode).toBe("ai_access_denied");
      expect((e as PaymentRequiredError).message).toContain("AI features");
    }
  });

  it("maps 429 quota_exceeded to QuotaExceededError", async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.json(
          {
            error: "quota_exceeded",
            message: "Monthly quota of 500,000 API requests exhausted.",
            plan: "Professional",
            used: 500001,
            quota: 500000,
          },
          { status: 429, headers: { "Retry-After": "3600" } }
        )
      )
    );
    const client = makeClient({ maxRetries: 0 });
    try {
      await client.request("GET", "/test");
    } catch (e) {
      expect(e).toBeInstanceOf(QuotaExceededError);
      expect((e as QuotaExceededError).errorCode).toBe("quota_exceeded");
    }
  });

  it("maps 429 token_quota_exceeded to QuotaExceededError", async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.json(
          {
            error: "token_quota_exceeded",
            message: "Monthly token quota of 5,000,000 tokens exhausted.",
            tokens_used: 10000001,
            token_quota: 5000000,
          },
          { status: 429, headers: { "Retry-After": "3600" } }
        )
      )
    );
    const client = makeClient({ maxRetries: 0 });
    try {
      await client.request("GET", "/test");
    } catch (e) {
      expect(e).toBeInstanceOf(QuotaExceededError);
      expect((e as QuotaExceededError).overagePolicy).toBe("TOKEN");
    }
  });

  it("maps 429 ai_daily_limit_exceeded to QuotaExceededError", async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.json(
          {
            error: "ai_daily_limit_exceeded",
            message: "Daily AI prompt limit of 5 reached.",
            prompts_used_today: 5,
            daily_limit: 5,
          },
          { status: 429, headers: { "Retry-After": "3600" } }
        )
      )
    );
    const client = makeClient({ maxRetries: 0 });
    try {
      await client.request("GET", "/test");
    } catch (e) {
      expect(e).toBeInstanceOf(QuotaExceededError);
      expect((e as QuotaExceededError).errorCode).toBe("ai_daily_limit_exceeded");
    }
  });

  it("maps 429 rate_limit_exceeded to RateLimitError", async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.json(
          {
            error: "rate_limit_exceeded",
            message: "Burst rate limit of 25 requests/second exceeded.",
            plan: "Professional",
            limit_rps: 25,
            retry_after_seconds: 1,
          },
          { status: 429, headers: { "Retry-After": "1" } }
        )
      )
    );
    const client = makeClient({ maxRetries: 0 });
    try {
      await client.request("GET", "/test");
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      expect((e as RateLimitError).retryAfter).toBe(1);
      expect((e as RateLimitError).errorCode).toBe("rate_limit_exceeded");
    }
  });

  it("maps 403 scope_denied to AuthenticationError", async () => {
    server.use(
      http.get(`${BASE}/test`, () =>
        HttpResponse.json(
          {
            error: "scope_denied",
            message: "This API key does not have permission for the requested resource.",
            allowed_scopes: "quotes",
            requested_path: "/v1/vq/options/AAPL/chain",
          },
          { status: 403 }
        )
      )
    );
    const client = makeClient({ maxRetries: 0 });
    try {
      await client.request("GET", "/test");
    } catch (e) {
      expect(e).toBeInstanceOf(AuthenticationError);
      expect((e as AuthenticationError).errorCode).toBe("scope_denied");
    }
  });
});
