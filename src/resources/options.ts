import type { VecTrade } from "../client";

export interface OptionContract {
  contractSymbol: string;
  type: "call" | "put";
  strike: number;
  expiration: string;
  bid: number;
  ask: number;
  lastPrice: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

export interface OptionsChain {
  symbol: string;
  expirations: string[];
  chain: OptionContract[];
}

export class Options {
  private client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get the options chain for a symbol. */
  async chain(
    symbol: string,
    options?: { expiration?: string; type?: "call" | "put" }
  ): Promise<OptionsChain> {
    const params: Record<string, string> = {};
    if (options?.expiration) params.expiration = options.expiration;
    if (options?.type) params.type = options.type;
    return this.client.request<OptionsChain>("GET", `/vq/options/${encodeURIComponent(symbol)}`, { params });
  }

  /** Get available expiration dates for a symbol. */
  async expirations(symbol: string): Promise<string[]> {
    const response = await this.client.request<{ data: string[] }>(
      "GET",
      `/vq/options/${encodeURIComponent(symbol)}/expirations`
    );
    return response.data;
  }
}
