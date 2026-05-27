import type { VecTrade } from "../client";
import { validateSymbol } from "../validate";

export interface ETFResponse {
  ticker: string;
  asset_class?: string;
  name?: string;
  description?: string;
  category?: string;
  fund_family?: string;
  legal_type?: string;
  exchange?: string;
  currency?: string;
  expense_ratio?: number;
  total_assets?: number;
  nav_price?: number;
  price?: number;
  previous_close?: number;
  ytd_return?: number;
  three_year_avg_return?: number;
  five_year_avg_return?: number;
  beta_3year?: number;
  trailing_pe?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  average_volume?: number;
  volume?: number;
  top_holdings?: Record<string, unknown>[];
  sector_weights?: Record<string, number>;
}

export class ETF {
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get ETF information, holdings, and sector weights. */
  async get(symbol: string): Promise<ETFResponse> {
    validateSymbol(symbol);
    return this.client.request<ETFResponse>("GET", `/vq/etf/${encodeURIComponent(symbol)}`);
  }
}
