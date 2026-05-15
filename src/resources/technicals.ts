import type { VecTrade } from "../client";

export interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorValue {
  timestamp: string;
  value: number;
}

export interface TechnicalResponse {
  symbol: string;
  interval: string;
  candles: CandleData[];
  indicators: Record<string, IndicatorValue[]>;
}

export class Technicals {
  private client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get technical indicators for a symbol. */
  async get(
    symbol: string,
    options?: {
      indicators?: string[];
      interval?: "1m" | "5m" | "15m" | "1h" | "1d" | "1w";
      period?: number;
    }
  ): Promise<TechnicalResponse> {
    const params: Record<string, string> = {
      interval: options?.interval ?? "1d",
      period: String(options?.period ?? 200),
    };
    if (options?.indicators) {
      params.indicators = options.indicators.join(",");
    }
    return this.client.request<TechnicalResponse>("GET", `/vq/technicals/${encodeURIComponent(symbol)}`, { params });
  }
}
