import { describe, it, expect } from "vitest";
import { snakeToCamel, camelCaseKeys } from "../src/transform";

describe("snakeToCamel", () => {
  it("converts simple snake_case", () => {
    expect(snakeToCamel("hello_world")).toBe("helloWorld");
  });

  it("converts multiple underscores", () => {
    expect(snakeToCamel("rate_limit_remaining")).toBe("rateLimitRemaining");
  });

  it("leaves camelCase unchanged", () => {
    expect(snakeToCamel("alreadyCamel")).toBe("alreadyCamel");
  });

  it("handles single word", () => {
    expect(snakeToCamel("symbol")).toBe("symbol");
  });

  it("handles numbers", () => {
    expect(snakeToCamel("field_1_name")).toBe("field1Name");
  });

  it("handles empty string", () => {
    expect(snakeToCamel("")).toBe("");
  });

  it("handles leading underscore", () => {
    expect(snakeToCamel("_private")).toBe("_private");
  });
});

describe("camelCaseKeys", () => {
  it("converts flat object keys", () => {
    const result = camelCaseKeys({ market_cap: 100, price_change: 1.5 });
    expect(result).toEqual({ marketCap: 100, priceChange: 1.5 });
  });

  it("converts nested object keys", () => {
    const result = camelCaseKeys({
      company_name: "Test",
      financial_data: { net_income: 50, gross_margin: 0.4 },
    });
    expect(result).toEqual({
      companyName: "Test",
      financialData: { netIncome: 50, grossMargin: 0.4 },
    });
  });

  it("converts array elements", () => {
    const result = camelCaseKeys([
      { ticker_symbol: "AAPL" },
      { ticker_symbol: "GOOGL" },
    ]);
    expect(result).toEqual([
      { tickerSymbol: "AAPL" },
      { tickerSymbol: "GOOGL" },
    ]);
  });

  it("handles mixed arrays and nested objects", () => {
    const result = camelCaseKeys({
      results: [{ per_share: 2.5, earnings_date: "2024-01-01" }],
      has_more: false,
    });
    expect(result).toEqual({
      results: [{ perShare: 2.5, earningsDate: "2024-01-01" }],
      hasMore: false,
    });
  });

  it("preserves primitive values", () => {
    expect(camelCaseKeys("hello")).toBe("hello");
    expect(camelCaseKeys(42)).toBe(42);
    expect(camelCaseKeys(null)).toBe(null);
    expect(camelCaseKeys(true)).toBe(true);
  });

  it("preserves Date objects", () => {
    const date = new Date("2024-01-01");
    expect(camelCaseKeys(date)).toBe(date);
  });

  it("handles empty object", () => {
    expect(camelCaseKeys({})).toEqual({});
  });

  it("handles empty array", () => {
    expect(camelCaseKeys([])).toEqual([]);
  });
});
