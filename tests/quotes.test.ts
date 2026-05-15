import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { VecTrade } from "../src/client";

const MOCK_QUOTE = {
  symbol: "AAPL",
  price: 198.5,
  change: 2.3,
  changePct: 1.17,
  volume: 45_000_000,
  dayHigh: 199.2,
  dayLow: 196.1,
  dayOpen: 196.8,
  previousClose: 196.2,
  marketCap: 3_100_000_000_000,
  timestamp: "2026-05-15T16:00:00Z",
};

const server = setupServer(
  http.get("https://api.vectrade.io/v1/vq/quotes/batch", ({ request }) => {
    const url = new URL(request.url);
    const symbols = url.searchParams.get("symbols")?.split(",") || [];
    const data = symbols.map((s) => ({ ...MOCK_QUOTE, symbol: s }));
    return HttpResponse.json({ data });
  }),

  http.get("https://api.vectrade.io/v1/vq/quotes/:symbol", ({ params }) => {
    if (params.symbol === "INVALID") {
      return HttpResponse.json(
        { error: { message: "Symbol not found", type: "not_found" } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ ...MOCK_QUOTE, symbol: params.symbol });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Quotes resource", () => {
  const client = new VecTrade({ apiKey: "vq_test_mock_key12345" });

  describe("get()", () => {
    it("fetches a single quote", async () => {
      const quote = await client.quotes.get("AAPL");
      expect(quote.symbol).toBe("AAPL");
      expect(quote.price).toBe(198.5);
      expect(quote.volume).toBe(45_000_000);
    });

    it("handles different symbols", async () => {
      const quote = await client.quotes.get("MSFT");
      expect(quote.symbol).toBe("MSFT");
    });

    it("throws on invalid symbol", async () => {
      await expect(client.quotes.get("INVALID")).rejects.toThrow();
    });
  });

  describe("batch()", () => {
    it("fetches multiple quotes", async () => {
      const quotes = await client.quotes.batch(["AAPL", "GOOGL", "MSFT"]);
      expect(quotes).toHaveLength(3);
      expect(quotes[0].symbol).toBe("AAPL");
      expect(quotes[1].symbol).toBe("GOOGL");
      expect(quotes[2].symbol).toBe("MSFT");
    });
  });

  describe("retry behavior", () => {
    it("retries on 500 and succeeds", async () => {
      let attempts = 0;
      server.use(
        http.get("https://api.vectrade.io/v1/vq/quotes/:symbol", () => {
          attempts++;
          if (attempts === 1) {
            return HttpResponse.json({ error: "server error" }, { status: 500 });
          }
          return HttpResponse.json({ ...MOCK_QUOTE, symbol: "RETRY" });
        })
      );

      const retryClient = new VecTrade({ apiKey: "vq_test_mock_key12345", maxRetries: 2, timeout: 5000 });
      const quote = await retryClient.quotes.get("RETRY");
      expect(quote.symbol).toBe("RETRY");
      expect(attempts).toBe(2);
    });

    it("throws after exhausting retries", async () => {
      server.use(
        http.get("https://api.vectrade.io/v1/vq/quotes/:symbol", () => {
          return HttpResponse.json({ error: { message: "server down", type: "server_error" } }, { status: 500 });
        })
      );

      const retryClient = new VecTrade({ apiKey: "vq_test_mock_key12345", maxRetries: 1, timeout: 5000 });
      await expect(retryClient.quotes.get("FAIL")).rejects.toThrow();
    });
  });
});
