import type { VecTrade } from "../client";
import { validateSymbol } from "../validate";

export interface HistoricalBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  adj_close?: number;
}

export interface HistoricalResponse {
  ticker: string;
  normalized_ticker?: string;
  market?: string;
  history: HistoricalBar[];
}

export class Historical {
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get historical OHLCV price data for a symbol. */
  async get(symbol: string, options?: { period?: string }): Promise<HistoricalResponse> {
    validateSymbol(symbol);
    const params: Record<string, string> = {};
    if (options?.period) params.period = options.period;
    return this.client.request<HistoricalResponse>(
      "GET",
      `/vq/quotes/${encodeURIComponent(symbol)}/history`,
      { params },
    );
  }
}
