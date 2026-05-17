import type { VecTrade } from "../client";

export interface FundamentalResponse {
  symbol: string;
  companyName: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  peRatio?: number;
  forwardPe?: number;
  eps?: number;
  dividendYield?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  avgVolume?: number;
  sharesOutstanding?: number;
}

export interface IncomeStatement {
  fiscalDate: string;
  period: "annual" | "quarterly";
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  epsBasic?: number;
  epsDiluted?: number;
}

export interface BalanceSheet {
  fiscalDate: string;
  period: "annual" | "quarterly";
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  cashAndEquivalents?: number;
  totalDebt?: number;
}

export class Fundamentals {
  private client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get fundamental data for a symbol. */
  async get(symbol: string): Promise<FundamentalResponse> {
    return this.client.request<FundamentalResponse>(
      "GET",
      `/vq/fundamentals/${encodeURIComponent(symbol)}`
    );
  }

  /** Get income statements. */
  async incomeStatement(
    symbol: string,
    options?: { period?: "annual" | "quarterly" }
  ): Promise<IncomeStatement[]> {
    const response = await this.client.request<{ data: IncomeStatement[] }>(
      "GET",
      `/vq/fundamentals/${encodeURIComponent(symbol)}/income`,
      {
        params: { period: options?.period ?? "annual" },
      }
    );
    return response.data;
  }

  /** Get balance sheets. */
  async balanceSheet(
    symbol: string,
    options?: { period?: "annual" | "quarterly" }
  ): Promise<BalanceSheet[]> {
    const response = await this.client.request<{ data: BalanceSheet[] }>(
      "GET",
      `/vq/fundamentals/${encodeURIComponent(symbol)}/balance-sheet`,
      {
        params: { period: options?.period ?? "annual" },
      }
    );
    return response.data;
  }
}
