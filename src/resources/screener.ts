import type { VecTrade } from "../client";
import { Paginator } from "../pagination";

export interface ScreenerResult {
  symbol: string;
  companyName: string;
  price: number;
  changePct: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  beta?: number;
  revenueGrowthYoy?: number;
  sector?: string;
  volume?: number;
  rsi14?: number;
}

export interface ScreenerFilters {
  marketCapMin?: number;
  marketCapMax?: number;
  peMax?: number;
  peMin?: number;
  dividendYieldMin?: number;
  dividendYieldMax?: number;
  changeMin?: number;
  changeMax?: number;
  betaMin?: number;
  betaMax?: number;
  revenueGrowthMin?: number;
  revenueGrowthMax?: number;
  rsiMin?: number;
  rsiMax?: number;
  volumeMin?: number;
  sector?: string;
  sortBy?:
    | "market_cap"
    | "pe_ratio"
    | "dividend_yield"
    | "volume"
    | "change_pct"
    | "rsi_14"
    | "beta"
    | "revenue_growth_yoy";
  sortOrder?: "asc" | "desc";
  limit?: number;
}

export class Screener {
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Run a stock screener. Returns an auto-paginating async iterator. */
  run(filters: ScreenerFilters = {}): Paginator<ScreenerResult> {
    return new Paginator<ScreenerResult>(async (cursor?: string | null) => {
      const limit = filters.limit ?? 20;
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        throw new Error("Screener limit must be an integer between 1 and 50.");
      }
      const params: Record<string, string> = {
        sort_by: filters.sortBy ?? "market_cap",
        sort_order: filters.sortOrder ?? "desc",
        limit: String(limit),
      };

      if (filters.marketCapMin !== undefined) params.market_cap_min = String(filters.marketCapMin);
      if (filters.marketCapMax !== undefined) params.market_cap_max = String(filters.marketCapMax);
      if (filters.peMax !== undefined) params.pe_max = String(filters.peMax);
      if (filters.peMin !== undefined) params.pe_min = String(filters.peMin);
      if (filters.dividendYieldMin !== undefined)
        params.dividend_yield_min = String(filters.dividendYieldMin);
      if (filters.dividendYieldMax !== undefined)
        params.dividend_yield_max = String(filters.dividendYieldMax);
      if (filters.changeMin !== undefined) params.change_min = String(filters.changeMin);
      if (filters.changeMax !== undefined) params.change_max = String(filters.changeMax);
      if (filters.betaMin !== undefined) params.beta_min = String(filters.betaMin);
      if (filters.betaMax !== undefined) params.beta_max = String(filters.betaMax);
      if (filters.revenueGrowthMin !== undefined)
        params.revenue_growth_min = String(filters.revenueGrowthMin);
      if (filters.revenueGrowthMax !== undefined)
        params.revenue_growth_max = String(filters.revenueGrowthMax);
      if (filters.rsiMin !== undefined) params.rsi_min = String(filters.rsiMin);
      if (filters.rsiMax !== undefined) params.rsi_max = String(filters.rsiMax);
      if (filters.volumeMin !== undefined) params.volume_min = String(filters.volumeMin);
      if (filters.sector) params.sector = filters.sector;
      if (cursor) params.cursor = cursor;

      const response = await this.client.request<{
        data: ScreenerResult[];
        page_info: { has_next: boolean; cursor: string | null };
      }>("GET", "/vq/screener", { params });
      return {
        data: response.data,
        hasMore: response.page_info.has_next,
        cursor: response.page_info.cursor,
      };
    });
  }
}
