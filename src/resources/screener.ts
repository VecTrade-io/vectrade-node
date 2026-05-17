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
  sector?: string;
  industry?: string;
  volume?: number;
  rsi14?: number;
}

export interface ScreenerFilters {
  marketCapMin?: number;
  marketCapMax?: number;
  peMax?: number;
  peMin?: number;
  dividendYieldMin?: number;
  sector?: string;
  industry?: string;
  country?: string;
  sortBy?: string;
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
      const params: Record<string, string> = {
        country: filters.country ?? "US",
        sort_by: filters.sortBy ?? "market_cap",
        sort_order: filters.sortOrder ?? "desc",
        limit: String(filters.limit ?? 50),
      };

      if (filters.marketCapMin !== undefined) params.market_cap_min = String(filters.marketCapMin);
      if (filters.marketCapMax !== undefined) params.market_cap_max = String(filters.marketCapMax);
      if (filters.peMax !== undefined) params.pe_max = String(filters.peMax);
      if (filters.peMin !== undefined) params.pe_min = String(filters.peMin);
      if (filters.dividendYieldMin !== undefined)
        params.dividend_yield_min = String(filters.dividendYieldMin);
      if (filters.sector) params.sector = filters.sector;
      if (filters.industry) params.industry = filters.industry;
      if (cursor) params.cursor = cursor;

      const response = await this.client.request<{
        data: ScreenerResult[];
        has_more: boolean;
        cursor: string | null;
      }>("GET", "/vq/screener", { params });
      return {
        data: response.data,
        hasMore: response.has_more,
        cursor: response.cursor,
      };
    });
  }
}
