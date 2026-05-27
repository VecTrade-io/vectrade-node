import type { VecTrade } from "../client";
import { validateSymbol } from "../validate";

export interface InsiderTransaction {
  symbol: string;
  insiderName: string;
  title: string;
  transactionType: "buy" | "sell" | "exercise";
  shares: number;
  price: number;
  totalValue: number;
  sharesOwnedAfter: number;
  filedAt: string;
}

export interface InsiderSummary {
  symbol: string;
  netShares30d: number;
  netValue30d: number;
  netShares90d: number;
  netValue90d: number;
  buyCount90d: number;
  sellCount90d: number;
  mostRecentTransaction?: InsiderTransaction;
}

export class Insider {
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get recent insider transactions for a symbol. */
  async transactions(symbol: string, options?: { limit?: number }): Promise<InsiderTransaction[]> {
    validateSymbol(symbol);
    const response = await this.client.request<{ trades: InsiderTransaction[] }>(
      "GET",
      `/vq/insider/${encodeURIComponent(symbol)}`
    );
    const limit = options?.limit ?? 20;
    return response.trades.slice(0, limit);
  }

  /** Get insider trading summary for a symbol. */
  async summary(symbol: string): Promise<InsiderSummary> {
    validateSymbol(symbol);
    return this.client.request<InsiderSummary>(
      "GET",
      `/vq/insider/${encodeURIComponent(symbol)}`
    );
  }
}
