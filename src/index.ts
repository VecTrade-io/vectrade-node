// Client
export { VecTrade } from "./client";
export type { VecTradeOptions, RequestOptions, ResponseMeta } from "./client";

// Version
export { SDK_VERSION } from "./version";

// Errors
export {
  VecTradeError,
  APIError,
  AuthenticationError,
  RateLimitError,
  ConfigurationError,
  NotFoundError,
  ValidationError,
  QuotaExceededError,
  PaymentRequiredError,
  ServerError,
  ServiceUnavailableError,
} from "./errors";

// Resources
export { Quotes } from "./resources/quotes";
export { Fundamentals } from "./resources/fundamentals";
export type { FundamentalResponse, IncomeStatement, BalanceSheet } from "./resources/fundamentals";
export { Technicals } from "./resources/technicals";
export type { CandleData, IndicatorValue, TechnicalResponse } from "./resources/technicals";
export { News } from "./resources/news";
export type { NewsArticle } from "./resources/news";
export { Screener } from "./resources/screener";
export type { ScreenerResult, ScreenerFilters } from "./resources/screener";
export { AI } from "./resources/ai";
export type { AIChunk } from "./resources/ai";
export { Options } from "./resources/options";
export type { OptionContract, OptionsChain } from "./resources/options";
export { Analyst } from "./resources/analyst";
export type { AnalystConsensus, PriceTarget, AnalystRating } from "./resources/analyst";
export { Earnings } from "./resources/earnings";
export type { EarningsResult, EarningsCalendarEntry } from "./resources/earnings";
export { Insider } from "./resources/insider";
export type { InsiderTransaction, InsiderSummary } from "./resources/insider";
export { WebhooksResource } from "./resources/webhooks";
export type { WebhookSubscription, CreateWebhookParams } from "./resources/webhooks";

// Pagination
export { Paginator } from "./pagination";
export type { PageResponse } from "./pagination";

// Streaming
export { parseSSEStream, toReadableStream } from "./streaming";
export type { StreamChunk } from "./streaming";

// Webhook verification
export { verifyWebhook } from "./webhooks";
export type { WebhookEvent, VerifyWebhookParams } from "./webhooks";

// Types
export type { QuoteResponse } from "./types/quote";

// Transform utilities (§6.3 — snake_case → camelCase)
export { snakeToCamel, camelCaseKeys } from "./transform";
