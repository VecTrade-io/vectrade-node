export interface QuoteResponse {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  dayOpen: number;
  previousClose: number;
  marketCap?: number;
  timestamp: string;
}
