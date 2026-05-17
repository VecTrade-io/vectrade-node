import type { VecTrade } from "../client";

export interface AnalystConsensus {
  symbol: string;
  consensus: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
  totalAnalysts: number;
  buy: number;
  hold: number;
  sell: number;
}

export interface PriceTarget {
  analystName: string;
  firm: string;
  target: number;
  rating: string;
  publishedAt: string;
}

export interface AnalystRating {
  analystName: string;
  firm: string;
  action: "initiated" | "upgraded" | "downgraded" | "reiterated";
  fromRating?: string;
  toRating: string;
  target?: number;
  publishedAt: string;
}

export class Analyst {
  private client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get analyst consensus rating for a symbol. */
  async consensus(symbol: string): Promise<AnalystConsensus> {
    return this.client.request<AnalystConsensus>(
      "GET",
      `/vq/analyst/${encodeURIComponent(symbol)}/consensus`
    );
  }

  /** Get individual analyst price targets. */
  async priceTargets(symbol: string): Promise<PriceTarget[]> {
    const response = await this.client.request<{ data: PriceTarget[] }>(
      "GET",
      `/vq/analyst/${encodeURIComponent(symbol)}/price-targets`
    );
    return response.data;
  }

  /** Get recent analyst rating changes. */
  async ratings(symbol: string, options?: { limit?: number }): Promise<AnalystRating[]> {
    const params: Record<string, string> = {};
    if (options?.limit) params.limit = String(options.limit);
    const response = await this.client.request<{ data: AnalystRating[] }>(
      "GET",
      `/vq/analyst/${encodeURIComponent(symbol)}/ratings`,
      { params }
    );
    return response.data;
  }
}
