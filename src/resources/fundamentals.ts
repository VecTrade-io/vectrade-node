import type { VecTrade } from "../client";
import { validateSymbol } from "../validate";

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
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get fundamental data for a symbol. */
  async get(symbol: string): Promise<FundamentalResponse> {
    validateSymbol(symbol);
    return this.client.request<FundamentalResponse>(
      "GET",
      `/vq/fundamentals/${encodeURIComponent(symbol)}`
    );
  }

  /** Get financial statements (income, balance sheet, cash flow). */
  async statements(
    symbol: string,
    options?: { period?: "annual" | "quarterly" }
  ): Promise<{ income_statement: IncomeStatement[]; balance_sheet: BalanceSheet[]; cashflow_statement: unknown[] }> {
    validateSymbol(symbol);
    const params: Record<string, string> = {};
    if (options?.period) params.period = options.period;
    return this.client.request<{ income_statement: IncomeStatement[]; balance_sheet: BalanceSheet[]; cashflow_statement: unknown[] }>(
      "GET",
      `/vq/fundamentals/${encodeURIComponent(symbol)}/statements`,
      { params }
    );
  }
}
