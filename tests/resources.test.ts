import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { VecTrade } from "../src/client";

const BASE = "https://api.vectrade.io/v1";

// --- Mock data ---
const MOCK_CONSENSUS = {
  symbol: "AAPL",
  consensus: "Buy",
  targetHigh: 250,
  targetLow: 180,
  targetMean: 215,
  targetMedian: 210,
  totalAnalysts: 35,
  buy: 28,
  hold: 5,
  sell: 2,
};

const MOCK_PRICE_TARGET = {
  analystName: "Dan Ives",
  firm: "Wedbush",
  target: 250,
  rating: "Outperform",
  publishedAt: "2026-05-10T12:00:00Z",
};

const MOCK_RATING = {
  analystName: "Dan Ives",
  firm: "Wedbush",
  action: "reiterated",
  toRating: "Outperform",
  target: 250,
  publishedAt: "2026-05-10T12:00:00Z",
};

const MOCK_EARNINGS = {
  symbol: "AAPL",
  date: "2026-01-30",
  fiscalQuarter: "Q1 2026",
  epsActual: 2.18,
  epsEstimate: 2.1,
  epsSurprise: 0.08,
  epsSurprisePct: 3.81,
  revenueActual: 124_000_000_000,
  revenueEstimate: 121_000_000_000,
  revenueSurprisePct: 2.48,
};

const MOCK_CALENDAR = {
  symbol: "AAPL",
  companyName: "Apple Inc.",
  date: "2026-07-31",
  time: "after_market",
  epsEstimate: 1.48,
  revenueEstimate: 85_000_000_000,
  fiscalQuarter: "Q3 2026",
};

const MOCK_FUNDAMENTAL = {
  symbol: "AAPL",
  companyName: "Apple Inc.",
  sector: "Technology",
  industry: "Consumer Electronics",
  marketCap: 3_100_000_000_000,
  peRatio: 32.5,
  forwardPe: 28.1,
  eps: 6.1,
  dividendYield: 0.53,
  beta: 1.24,
  fiftyTwoWeekHigh: 210,
  fiftyTwoWeekLow: 160,
  avgVolume: 55_000_000,
  sharesOutstanding: 15_000_000_000,
};

const MOCK_INCOME = {
  fiscalDate: "2025-09-30",
  period: "annual",
  revenue: 394_000_000_000,
  grossProfit: 170_000_000_000,
  operatingIncome: 112_000_000_000,
  netIncome: 97_000_000_000,
  epsBasic: 6.43,
  epsDiluted: 6.38,
};

const MOCK_BALANCE = {
  fiscalDate: "2025-09-30",
  period: "annual",
  totalAssets: 352_000_000_000,
  totalLiabilities: 290_000_000_000,
  totalEquity: 62_000_000_000,
  cashAndEquivalents: 29_000_000_000,
  totalDebt: 108_000_000_000,
};

const MOCK_INSIDER_TX = {
  symbol: "AAPL",
  insiderName: "Tim Cook",
  title: "CEO",
  transactionType: "sell",
  shares: 50000,
  price: 198.5,
  totalValue: 9_925_000,
  sharesOwnedAfter: 3_280_000,
  filedAt: "2026-05-01T00:00:00Z",
};

const MOCK_INSIDER_SUMMARY = {
  symbol: "AAPL",
  netShares30d: -120000,
  netValue30d: -23_800_000,
  netShares90d: -350000,
  netValue90d: -69_000_000,
  buyCount90d: 2,
  sellCount90d: 8,
};

const MOCK_NEWS = {
  id: "news-001",
  title: "Apple Announces Q3 Results",
  summary: "Better than expected...",
  url: "https://example.com/article",
  source: "Reuters",
  publishedAt: "2026-05-15T08:00:00Z",
  symbols: ["AAPL"],
  category: "earnings",
  sentiment: 0.72,
};

const MOCK_OPTION = {
  contractSymbol: "AAPL260620C00200000",
  type: "call",
  strike: 200,
  expiration: "2026-06-20",
  bid: 5.2,
  ask: 5.5,
  lastPrice: 5.35,
  volume: 12000,
  openInterest: 45000,
  impliedVolatility: 0.25,
  delta: 0.52,
  gamma: 0.03,
  theta: -0.15,
  vega: 0.22,
};

const MOCK_SCREENER_RESULT = {
  symbol: "AAPL",
  companyName: "Apple Inc.",
  price: 198.5,
  changePct: 1.17,
  marketCap: 3_100_000_000_000,
  peRatio: 32.5,
  dividendYield: 0.53,
  sector: "Technology",
  industry: "Consumer Electronics",
  volume: 45_000_000,
  rsi14: 55.2,
};

const MOCK_TECHNICAL = {
  symbol: "AAPL",
  interval: "1d",
  candles: [
    {
      timestamp: "2026-05-15",
      open: 196.8,
      high: 199.2,
      low: 196.1,
      close: 198.5,
      volume: 45_000_000,
    },
  ],
  indicators: {
    sma_20: [{ timestamp: "2026-05-15", value: 194.3 }],
    rsi_14: [{ timestamp: "2026-05-15", value: 55.2 }],
  },
};

const MOCK_KEYS = [
  {
    id: "key-001",
    keyPrefix: "vq_live_abc",
    label: "Production",
    scopes: ["read", "write"],
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const MOCK_KEY_CREATED = {
  ...MOCK_KEYS[0],
  rawKey: "vq_live_abc123def456ghi789",
};

const MOCK_USAGE = {
  period: "2026-05",
  totalRequests: 12500,
  aiRequests: 2000,
  errorCount: 45,
  tokensUsed: 850000,
  quotaLimit: 100000,
  quotaRemaining: 87500,
};

const MOCK_DAILY_USAGE = [
  {
    day: "2026-05-15",
    endpoint: "/vq/quotes",
    method: "GET",
    callCount: 450,
    errorCount: 2,
    tokensUsed: 0,
  },
];

const MOCK_PLAN = {
  id: "sub-001",
  planId: "pro",
  planName: "Pro",
  status: "active",
  currentPeriodStart: "2026-05-01T00:00:00Z",
  currentPeriodEnd: "2026-05-31T23:59:59Z",
  createdAt: "2025-01-01T00:00:00Z",
};

const MOCK_QUOTA = {
  planId: "pro",
  monthlyQuota: 100000,
  used: 12500,
  remaining: 87500,
  overagePolicy: "block",
  resetAt: "2026-06-01T00:00:00Z",
};

// --- MSW server ---
const server = setupServer(
  // Analyst
  http.get(`${BASE}/vq/analyst/:symbol/consensus`, () => HttpResponse.json(MOCK_CONSENSUS)),
  http.get(`${BASE}/vq/analyst/:symbol/price-targets`, () =>
    HttpResponse.json({ data: [MOCK_PRICE_TARGET] })
  ),
  http.get(`${BASE}/vq/analyst/:symbol/ratings`, () => HttpResponse.json({ data: [MOCK_RATING] })),

  // Earnings
  http.get(`${BASE}/vq/earnings/:symbol/history`, () =>
    HttpResponse.json({ data: [MOCK_EARNINGS] })
  ),
  http.get(`${BASE}/vq/earnings/calendar`, () => HttpResponse.json({ data: [MOCK_CALENDAR] })),

  // Fundamentals
  http.get(`${BASE}/vq/fundamentals/:symbol/income`, () =>
    HttpResponse.json({ data: [MOCK_INCOME] })
  ),
  http.get(`${BASE}/vq/fundamentals/:symbol/balance-sheet`, () =>
    HttpResponse.json({ data: [MOCK_BALANCE] })
  ),
  http.get(`${BASE}/vq/fundamentals/:symbol`, () => HttpResponse.json(MOCK_FUNDAMENTAL)),

  // Insider
  http.get(`${BASE}/vq/insider/:symbol/transactions`, () =>
    HttpResponse.json({ data: [MOCK_INSIDER_TX] })
  ),
  http.get(`${BASE}/vq/insider/:symbol/summary`, () => HttpResponse.json(MOCK_INSIDER_SUMMARY)),

  // News
  http.get(`${BASE}/vq/news/:id`, ({ params }) => {
    if (params.id === "news-001") return HttpResponse.json(MOCK_NEWS);
    return HttpResponse.json({ data: [MOCK_NEWS] });
  }),
  http.get(`${BASE}/vq/news`, () => HttpResponse.json({ data: [MOCK_NEWS] })),

  // Options
  http.get(`${BASE}/vq/options/:symbol/expirations`, () =>
    HttpResponse.json({ data: ["2026-06-20", "2026-07-18", "2026-08-15"] })
  ),
  http.get(`${BASE}/vq/options/:symbol`, () =>
    HttpResponse.json({
      symbol: "AAPL",
      expirations: ["2026-06-20"],
      chain: [MOCK_OPTION],
    })
  ),

  // Screener
  http.get(`${BASE}/vq/screener`, () =>
    HttpResponse.json({
      data: [MOCK_SCREENER_RESULT],
      has_more: false,
      cursor: null,
    })
  ),

  // Technicals
  http.get(`${BASE}/vq/technicals/:symbol`, () => HttpResponse.json(MOCK_TECHNICAL)),

  // Developer
  http.get(`${BASE}/vq/developer/keys`, () => HttpResponse.json(MOCK_KEYS)),
  http.post(`${BASE}/vq/developer/keys`, () => HttpResponse.json(MOCK_KEY_CREATED)),
  http.delete(`${BASE}/vq/developer/keys/:keyId`, () => HttpResponse.json({}, { status: 200 })),
  http.get(`${BASE}/vq/developer/usage/daily`, () => HttpResponse.json(MOCK_DAILY_USAGE)),
  http.get(`${BASE}/vq/developer/usage`, () => HttpResponse.json(MOCK_USAGE)),
  http.get(`${BASE}/vq/developer/plan`, () => HttpResponse.json(MOCK_PLAN)),
  http.get(`${BASE}/vq/developer/quota`, () => HttpResponse.json(MOCK_QUOTA)),

  // AI stream
  http.post(`${BASE}/vq/ai/analyze`, () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"text":"Analysis","type":"text"}\n\n'));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new HttpResponse(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const client = new VecTrade({ apiKey: "vq_test_mock_key12345" });

// === Analyst ===
describe("Analyst resource", () => {
  it("gets consensus", async () => {
    const result = await client.analyst.consensus("AAPL");
    expect(result.symbol).toBe("AAPL");
    expect(result.consensus).toBe("Buy");
    expect(result.totalAnalysts).toBe(35);
  });

  it("gets price targets", async () => {
    const targets = await client.analyst.priceTargets("AAPL");
    expect(targets).toHaveLength(1);
    expect(targets[0].firm).toBe("Wedbush");
    expect(targets[0].target).toBe(250);
  });

  it("gets ratings", async () => {
    const ratings = await client.analyst.ratings("AAPL");
    expect(ratings).toHaveLength(1);
    expect(ratings[0].action).toBe("reiterated");
  });

  it("gets ratings with limit option", async () => {
    const ratings = await client.analyst.ratings("AAPL", { limit: 5 });
    expect(ratings).toHaveLength(1);
  });
});

// === Earnings ===
describe("Earnings resource", () => {
  it("gets earnings history", async () => {
    const history = await client.earnings.history("AAPL");
    expect(history).toHaveLength(1);
    expect(history[0].epsActual).toBe(2.18);
  });

  it("gets earnings history with limit", async () => {
    const history = await client.earnings.history("AAPL", { limit: 4 });
    expect(history).toHaveLength(1);
  });

  it("gets earnings calendar", async () => {
    const calendar = await client.earnings.calendar();
    expect(calendar).toHaveLength(1);
    expect(calendar[0].time).toBe("after_market");
  });

  it("gets earnings calendar with date range", async () => {
    const calendar = await client.earnings.calendar({
      from: "2026-07-01",
      to: "2026-07-31",
    });
    expect(calendar).toHaveLength(1);
  });
});

// === Fundamentals ===
describe("Fundamentals resource", () => {
  it("gets fundamental data", async () => {
    const data = await client.fundamentals.get("AAPL");
    expect(data.symbol).toBe("AAPL");
    expect(data.companyName).toBe("Apple Inc.");
    expect(data.peRatio).toBe(32.5);
  });

  it("gets income statements", async () => {
    const statements = await client.fundamentals.incomeStatement("AAPL");
    expect(statements).toHaveLength(1);
    expect(statements[0].revenue).toBe(394_000_000_000);
  });

  it("gets income statements with period option", async () => {
    const statements = await client.fundamentals.incomeStatement("AAPL", {
      period: "quarterly",
    });
    expect(statements).toHaveLength(1);
  });

  it("gets balance sheets", async () => {
    const sheets = await client.fundamentals.balanceSheet("AAPL");
    expect(sheets).toHaveLength(1);
    expect(sheets[0].totalAssets).toBe(352_000_000_000);
  });

  it("gets balance sheets with period option", async () => {
    const sheets = await client.fundamentals.balanceSheet("AAPL", {
      period: "quarterly",
    });
    expect(sheets).toHaveLength(1);
  });
});

// === Insider ===
describe("Insider resource", () => {
  it("gets insider transactions", async () => {
    const txs = await client.insider.transactions("AAPL");
    expect(txs).toHaveLength(1);
    expect(txs[0].insiderName).toBe("Tim Cook");
    expect(txs[0].transactionType).toBe("sell");
  });

  it("gets insider transactions with limit", async () => {
    const txs = await client.insider.transactions("AAPL", { limit: 10 });
    expect(txs).toHaveLength(1);
  });

  it("gets insider summary", async () => {
    const summary = await client.insider.summary("AAPL");
    expect(summary.symbol).toBe("AAPL");
    expect(summary.sellCount90d).toBe(8);
  });
});

// === News ===
describe("News resource", () => {
  it("lists news articles", async () => {
    const articles = await client.news.list();
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toContain("Apple");
  });

  it("lists news with symbol filter", async () => {
    const articles = await client.news.list({ symbols: ["AAPL"], limit: 5 });
    expect(articles).toHaveLength(1);
  });

  it("lists news with category filter", async () => {
    const articles = await client.news.list({ category: "earnings" });
    expect(articles).toHaveLength(1);
  });

  it("gets a single article", async () => {
    const article = await client.news.get("news-001");
    expect(article.id).toBe("news-001");
    expect(article.source).toBe("Reuters");
  });
});

// === Options ===
describe("Options resource", () => {
  it("gets options chain", async () => {
    const chain = await client.options.chain("AAPL");
    expect(chain.symbol).toBe("AAPL");
    expect(chain.chain).toHaveLength(1);
    expect(chain.chain[0].type).toBe("call");
  });

  it("gets options chain with filters", async () => {
    const chain = await client.options.chain("AAPL", {
      expiration: "2026-06-20",
      type: "call",
    });
    expect(chain.chain).toHaveLength(1);
  });

  it("gets available expirations", async () => {
    const exps = await client.options.expirations("AAPL");
    expect(exps).toHaveLength(3);
    expect(exps[0]).toBe("2026-06-20");
  });
});

// === Screener ===
describe("Screener resource", () => {
  it("runs screener with defaults", async () => {
    const results: unknown[] = [];
    for await (const item of client.screener.run()) {
      results.push(item);
    }
    expect(results).toHaveLength(1);
    expect((results[0] as { symbol: string }).symbol).toBe("AAPL");
  });

  it("runs screener with all filters", async () => {
    const results: unknown[] = [];
    for await (const item of client.screener.run({
      marketCapMin: 1_000_000_000,
      marketCapMax: 5_000_000_000_000,
      peMin: 10,
      peMax: 50,
      dividendYieldMin: 0.5,
      sector: "Technology",
      industry: "Consumer Electronics",
      country: "US",
      sortBy: "price",
      sortOrder: "asc",
      limit: 25,
    })) {
      results.push(item);
    }
    expect(results).toHaveLength(1);
  });
});

// === Technicals ===
describe("Technicals resource", () => {
  it("gets technicals with defaults", async () => {
    const data = await client.technicals.get("AAPL");
    expect(data.symbol).toBe("AAPL");
    expect(data.candles).toHaveLength(1);
    expect(data.indicators.sma_20).toBeDefined();
  });

  it("gets technicals with options", async () => {
    const data = await client.technicals.get("AAPL", {
      indicators: ["sma_20", "rsi_14"],
      interval: "1h",
      period: 100,
    });
    expect(data.symbol).toBe("AAPL");
  });
});

// === Developer ===
describe("Developer resource", () => {
  it("lists API keys", async () => {
    const keys = await client.developer.listKeys();
    expect(keys).toHaveLength(1);
    expect(keys[0].label).toBe("Production");
  });

  it("creates a new key", async () => {
    const key = await client.developer.createKey({
      label: "CI/CD",
      scopes: ["read"],
    });
    expect(key.rawKey).toContain("vq_live_");
    expect(key.label).toBe("Production");
  });

  it("revokes a key", async () => {
    await expect(client.developer.revokeKey("key-001")).resolves.toBeUndefined();
  });

  it("gets usage", async () => {
    const usage = await client.developer.getUsage();
    expect(usage.totalRequests).toBe(12500);
    expect(usage.quotaRemaining).toBe(87500);
  });

  it("gets daily usage", async () => {
    const daily = await client.developer.getDailyUsage();
    expect(daily).toHaveLength(1);
    expect(daily[0].callCount).toBe(450);
  });

  it("gets daily usage with days limit", async () => {
    const daily = await client.developer.getDailyUsage({ days: 7 });
    expect(daily).toHaveLength(1);
  });

  it("gets plan", async () => {
    const plan = await client.developer.getPlan();
    expect(plan.planName).toBe("Pro");
    expect(plan.status).toBe("active");
  });

  it("gets quota", async () => {
    const quota = await client.developer.getQuota();
    expect(quota.remaining).toBe(87500);
    expect(quota.overagePolicy).toBe("block");
  });
});

// === AI ===
describe("AI resource", () => {
  it("streams analysis response", async () => {
    const chunks: unknown[] = [];
    for await (const chunk of client.ai.stream("Analyze AAPL")) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect((chunks[0] as { text: string }).text).toBe("Analysis");
  });
});
