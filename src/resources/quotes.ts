import type { VecTrade } from "../client";
import type { QuoteResponse } from "../types/quote";
import { validateSymbol, validateSymbols } from "../validate";

function normalizeQuote(payload: QuoteResponse | Record<string, unknown>): QuoteResponse {
  const quote = payload as Record<string, unknown>;
  const number = (...keys: string[]): number => {
    for (const key of keys) {
      const value = quote[key];
      if (typeof value === "number") return value;
      if (typeof value === "string" && value.trim()) return Number(value);
    }
    return 0;
  };
  const marketCap = quote.marketCap ?? quote.market_cap;

  return {
    symbol: String(quote.symbol ?? quote.ticker ?? ""),
    price: number("price"),
    change: number("change"),
    changePct: number("changePct", "change_percent", "changePercent"),
    volume: number("volume"),
    dayHigh: number("dayHigh", "high"),
    dayLow: number("dayLow", "low"),
    dayOpen: number("dayOpen", "open"),
    previousClose: number("previousClose", "prevClose", "previous_close"),
    ...(typeof marketCap === "number" ? { marketCap } : {}),
    timestamp: String(quote.timestamp ?? quote.updated_at ?? ""),
  };
}

export class Quotes {
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get a real-time quote for a single symbol. */
  async get(symbol: string, options?: { fields?: string[] }): Promise<QuoteResponse> {
    validateSymbol(symbol);
    const params: Record<string, string> = {};
    if (options?.fields) {
      params.fields = options.fields.join(",");
    }
    const response = await this.client.request<QuoteResponse | Record<string, unknown>>(
      "GET",
      `/vq/quotes/${encodeURIComponent(symbol)}`,
      { params }
    );
    return normalizeQuote(response);
  }

  /** Get quotes for multiple symbols in a single request. */
  async batch(symbols: string[]): Promise<QuoteResponse[]> {
    validateSymbols(symbols, "symbols", 20);
    const response = await this.client.request<
      | { data: Record<string, QuoteResponse> | QuoteResponse[] }
      | Record<string, QuoteResponse>
      | QuoteResponse[]
    >("GET", "/vq/quotes/batch", {
      params: { tickers: symbols.join(",") },
    });
    const data = Array.isArray(response) ? response : "data" in response ? response.data : response;
    const quotes = Array.isArray(data) ? data : Object.values(data);
    return quotes.map(normalizeQuote);
  }
}
