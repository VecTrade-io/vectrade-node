import type { VecTrade } from "../client";
import type { QuoteResponse } from "../types/quote";

export class Quotes {
  private client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get a real-time quote for a single symbol. */
  async get(symbol: string, options?: { fields?: string[] }): Promise<QuoteResponse> {
    const params: Record<string, string> = {};
    if (options?.fields) {
      params.fields = options.fields.join(",");
    }
    return this.client.request<QuoteResponse>("GET", `/vq/quotes/${encodeURIComponent(symbol)}`, {
      params,
    });
  }

  /** Get quotes for multiple symbols in a single request. */
  async batch(symbols: string[]): Promise<QuoteResponse[]> {
    const response = await this.client.request<{ data: QuoteResponse[] }>(
      "GET",
      "/vq/quotes/batch",
      {
        params: { symbols: symbols.join(",") },
      }
    );
    return response.data;
  }
}
