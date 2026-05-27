import type { VecTrade } from "../client";
import { validateSymbol } from "../validate";

export interface EarningsResult {
  symbol: string;
  date: string;
  fiscalQuarter: string;
  epsActual: number;
  epsEstimate: number;
  epsSurprise: number;
  epsSurprisePct: number;
  revenueActual: number;
  revenueEstimate: number;
  revenueSurprisePct: number;
}

export interface EarningsCalendarEntry {
  symbol: string;
  companyName: string;
  date: string;
  time: "before_market" | "after_market" | "during_market";
  epsEstimate?: number;
  revenueEstimate?: number;
  fiscalQuarter: string;
}

export class Earnings {
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get historical earnings results for a symbol. */
  async history(symbol: string, options?: { limit?: number }): Promise<EarningsResult[]> {
    validateSymbol(symbol);
    const params: Record<string, string> = {};
    if (options?.limit) params.limit = String(options.limit);
    const response = await this.client.request<{ history: EarningsResult[] }>(
      "GET",
      `/vq/earnings/${encodeURIComponent(symbol)}`,
      { params }
    );
    return response.history;
  }

  /** Get upcoming earnings calendar. */
  async calendar(options?: { from?: string; to?: string }): Promise<EarningsCalendarEntry[]> {
    const params: Record<string, string> = {};
    if (options?.from) params.from = options.from;
    if (options?.to) params.to = options.to;
    const response = await this.client.request<{ data: EarningsCalendarEntry[] }>(
      "GET",
      "/vq/earnings/calendar",
      { params }
    );
    return response.data;
  }
}
