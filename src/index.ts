// Client
export { VecTrade } from "./client";
export type { VecTradeOptions, RequestOptions, ResponseMeta } from "./client";

// Version
export { SDK_VERSION } from "./version";

// Tier config
export { DEFAULT_TIERS, getDefaultTier } from "./tier-config";
export type { PlanDefaults } from "./tier-config";

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
  TimeoutError,
  RequestAbortedError,
  ConnectionError,
} from "./errors";

// Resources
export { Quotes } from "./resources/quotes";
export { Fundamentals } from "./resources/fundamentals";
export type { FundamentalResponse, IncomeStatement, BalanceSheet } from "./resources/fundamentals";
export { Technicals } from "./resources/technicals";
export type { CandleData, IndicatorValue, TechnicalResponse } from "./resources/technicals";
export { News } from "./resources/news";
export type { NewsArticle } from "./resources/news";
export { Options } from "./resources/options";
export type { OptionContract, OptionsChain } from "./resources/options";
export { Analyst } from "./resources/analyst";
export type { AnalystConsensus, PriceTarget, AnalystRating } from "./resources/analyst";
export { Earnings } from "./resources/earnings";
export type { EarningsResult, EarningsCalendarEntry } from "./resources/earnings";
export { Insider } from "./resources/insider";
export type { InsiderTransaction, InsiderSummary } from "./resources/insider";
export { Profile } from "./resources/profile";
export type { ProfileResponse, CompanyInfo, LocationInfo } from "./resources/profile";
export { Sentiment } from "./resources/sentiment";
export type { SentimentResponse, SocialSentiment, NewsSentimentBreakdown } from "./resources/sentiment";
export { Historical } from "./resources/historical";
export type { HistoricalResponse, HistoricalBar } from "./resources/historical";
export { ETF } from "./resources/etf";
export type { ETFResponse } from "./resources/etf";
export type { WebhookSubscription, CreateWebhookParams } from "./resources/webhooks";
export { Developer } from "./resources/developer";
export type {
  ApiKeyResponse,
  ApiKeyCreated,
  UsageResponse,
  DailyUsageResponse,
  PlanResponse,
  QuotaResponse,
} from "./resources/developer";

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

// Validation utilities
export { validateSymbol, validateSymbols } from "./validate";
