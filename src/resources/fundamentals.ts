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

export interface StatementSection {
  ticker: string;
  earnings: Array<Record<string, unknown>>;
  source?: string;
}

export type StatementData = StatementSection | [];

export interface FinancialStatementsResponse {
  ticker: string;
  income_statement: StatementData;
  balance_sheet: StatementData;
  cashflow_statement: StatementData;
  market?: string;
  source?: string;
  timestamp?: string;
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
  ): Promise<FinancialStatementsResponse> {
    validateSymbol(symbol);
    const params: Record<string, string> = {};
    if (options?.period) params.period = options.period;
    return this.client.request<FinancialStatementsResponse>(
      "GET",
      `/vq/fundamentals/${encodeURIComponent(symbol)}/statements`,
      { params }
    );
  }
}
