import { Quotes } from "./resources/quotes";
import { Fundamentals } from "./resources/fundamentals";
import { Technicals } from "./resources/technicals";
import { News } from "./resources/news";
import { Screener } from "./resources/screener";
import { AI } from "./resources/ai";
import { Options } from "./resources/options";
import { Analyst } from "./resources/analyst";
import { Earnings } from "./resources/earnings";
import { Insider } from "./resources/insider";
import { WebhooksResource } from "./resources/webhooks";
import { Developer } from "./resources/developer";
import {
  ConfigurationError,
  VecTradeError,
  APIError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  ServerError,
  QuotaExceededError,
  PaymentRequiredError,
  ServiceUnavailableError,
  TimeoutError,
  RequestAbortedError,
  ConnectionError,
} from "./errors";
import { SDK_VERSION } from "./version";

export interface VecTradeOptions {
  /** API key. Defaults to VECTRADE_API_KEY env var. */
  apiKey?: string;
  /** Custom base URL. */
  baseURL?: string;
  /** Request timeout in milliseconds. Default: 30000. */
  timeout?: number;
  /** Maximum automatic retries on 429/5xx. Default: 2. */
  maxRetries?: number;
}

export interface RequestOptions {
  /** Query parameters to include in the URL. */
  params?: Record<string, string>;
  /** Idempotency key for safe mutation retries. */
  idempotencyKey?: string;
  /** Additional headers. */
  headers?: Record<string, string>;
  /** Request body for POST/PUT/PATCH. */
  body?: string;
  /** Per-request timeout in milliseconds (overrides client default). */
  timeout?: number;
  /** User-supplied AbortSignal for request cancellation. */
  signal?: AbortSignal;
}

/** Metadata from the last API response. */
export interface ResponseMeta {
  requestId: string | undefined;
  rateLimitRemaining: number | undefined;
  rateLimitReset: number | undefined;
  /** Number of retries performed for this request (0 = succeeded on first try). */
  retries: number;
}

const BASE_URL = "https://api.vectrade.io/v1";

export class VecTrade {
  readonly apiKey: string;
  readonly baseURL: string;
  readonly timeout: number;
  readonly maxRetries: number;

  /** Metadata from the most recent API response (observable). */
  lastResponseMeta: ResponseMeta | undefined;

  /** Quotes API resource. */
  readonly quotes: Quotes;
  /** Fundamentals API resource. */
  readonly fundamentals: Fundamentals;
  /** Technicals API resource. */
  readonly technicals: Technicals;
  /** News API resource. */
  readonly news: News;
  /** Screener API resource. */
  readonly screener: Screener;
  /** AI analysis resource. */
  readonly ai: AI;
  /** Options API resource. */
  readonly options: Options;
  /** Analyst ratings resource. */
  readonly analyst: Analyst;
  /** Earnings data resource. */
  readonly earnings: Earnings;
  /** Insider trading resource. */
  readonly insider: Insider;
  /** Webhooks management resource. */
  readonly webhooks: WebhooksResource;
  /** Developer self-service resource (keys, usage, quota). */
  readonly developer: Developer;

  constructor(options: VecTradeOptions = {}) {
    const apiKey =
      options.apiKey ??
      (typeof process !== "undefined" ? process.env?.VECTRADE_API_KEY : undefined);

    if (!apiKey) {
      throw new ConfigurationError(
        "apiKey is required. Pass it as an option or set VECTRADE_API_KEY environment variable."
      );
    }

    this.apiKey = apiKey;
    this.baseURL = options.baseURL ?? BASE_URL;
    this.timeout = options.timeout ?? 30_000;
    this.maxRetries = options.maxRetries ?? 2;

    // Hide apiKey from console.log / JSON.stringify / Object.keys enumeration
    Object.defineProperty(this, "apiKey", { enumerable: false });

    // Warn about non-HTTPS base URLs (allows local dev but flags risk)
    if (this.baseURL && !this.baseURL.startsWith("https://")) {
      if (typeof console !== "undefined") {
        console.warn(
          `[VecTrade] base URL uses non-HTTPS scheme (${this.baseURL}). ` +
            `This is insecure and should only be used for local development.`
        );
      }
    }

    this.quotes = new Quotes(this);
    this.fundamentals = new Fundamentals(this);
    this.technicals = new Technicals(this);
    this.news = new News(this);
    this.screener = new Screener(this);
    this.ai = new AI(this);
    this.options = new Options(this);
    this.analyst = new Analyst(this);
    this.earnings = new Earnings(this);
    this.insider = new Insider(this);
    this.webhooks = new WebhooksResource(this);
    this.developer = new Developer(this);
  }

  /** Make an authenticated request to the VecTrade API. */
  async request<T>(method: string, path: string, options?: RequestOptions): Promise<T> {
    const base = this.baseURL.endsWith("/") ? this.baseURL.slice(0, -1) : this.baseURL;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${base}${normalizedPath}`);
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, value);
      }
    }

    const headers = new Headers(options?.headers);
    headers.set("Authorization", `Bearer ${this.apiKey}`);
    headers.set("Content-Type", "application/json");
    headers.set("User-Agent", `vectrade-node/${SDK_VERSION}`);

    // Set idempotency key for safe mutation retries (§6.1)
    if (options?.idempotencyKey) {
      headers.set("Idempotency-Key", options.idempotencyKey);
    }

    const effectiveTimeout = options?.timeout ?? this.timeout;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff with jitter
        const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        const jitter = Math.random() * baseDelay * 0.5;
        await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

      // Forward user-supplied AbortSignal
      if (options?.signal) {
        if (options.signal.aborted) {
          clearTimeout(timeoutId);
          throw new RequestAbortedError();
        }
        options.signal.addEventListener("abort", () => controller.abort(options.signal!.reason), {
          once: true,
        });
      }

      try {
        const fetchOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };
        if (options?.body) {
          fetchOptions.body = options.body;
        }
        const response = await fetch(url.toString(), fetchOptions);

        if (!response.ok) {
          // Only retry on 429 and 5xx
          if ((response.status === 429 || response.status >= 500) && attempt < this.maxRetries) {
            lastError = new APIError(`HTTP ${response.status}`, { status: response.status });
            continue;
          }
          await this.handleErrorResponse(response);
        }

        // Capture response metadata for observability (§6.1, §12.4)
        this.lastResponseMeta = {
          requestId: response.headers.get("x-request-id") ?? undefined,
          rateLimitRemaining: parseNumberHeader(response.headers.get("x-vq-ratelimit-remaining")),
          rateLimitReset: undefined, // Finance core does not send this header
          retries: attempt,
        };

        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof APIError) {
          throw error;
        }

        // Distinguish timeout vs user-abort vs network error
        if (error instanceof Error && error.name === "AbortError") {
          // If user signal was aborted, don't retry — it's intentional
          if (options?.signal?.aborted) {
            throw new RequestAbortedError();
          }
          // Otherwise it's our internal timeout
          throw new TimeoutError(
            `Request to ${method} ${path} timed out after ${effectiveTimeout}ms`
          );
        }

        // Retry transient network errors
        if (attempt < this.maxRetries) {
          lastError = error instanceof Error ? error : new Error(String(error));
          continue;
        }

        // Wrap unknown errors in ConnectionError for consistent error handling
        if (error instanceof Error && !(error instanceof VecTradeError)) {
          throw new ConnectionError(error.message);
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError ?? new ConnectionError("Request failed after retries");
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const rawBody = await response.text().catch(() => "");
    const requestId = response.headers.get("x-request-id") ?? undefined;

    // Parse JSON error body — supports VecTrade core, RFC 9457, and nested envelope
    let message = rawBody || `HTTP ${response.status}`;
    let errorCode: string | undefined;
    let details: Record<string, unknown> | undefined;
    let bodyRetryAfter: number | undefined;
    try {
      const body = JSON.parse(rawBody) as Record<string, unknown>;
      // VecTrade core format: { error_code, message, details, retry_after }
      if (typeof body["error_code"] === "string") {
        errorCode = body["error_code"];
        if (typeof body["message"] === "string") message = body["message"];
        if (body["details"] && typeof body["details"] === "object") {
          details = body["details"] as Record<string, unknown>;
        }
        if (typeof body["retry_after"] === "number") {
          bodyRetryAfter = body["retry_after"];
        }
      }
      // RFC 9457: { detail, type, title }
      else if (typeof body["detail"] === "string") {
        message = body["detail"];
        errorCode = typeof body["type"] === "string" ? body["type"] : undefined;
      }
      // Nested envelope: { error: { message, type } }
      else if (body["error"] && typeof body["error"] === "object") {
        const err = body["error"] as Record<string, unknown>;
        if (typeof err["message"] === "string") message = err["message"];
        errorCode = typeof err["type"] === "string" ? err["type"] : undefined;
      }
    } catch {
      // Not JSON — keep rawBody as message
    }

    const baseOpts = { status: response.status, requestId, errorCode, details };

    // Quota headers
    const quotaLimit = parseNumberHeader(response.headers.get("x-vq-quota-limit"));
    const quotaRemaining = parseNumberHeader(response.headers.get("x-vq-quota-remaining"));

    if (response.status === 401) {
      throw new AuthenticationError(message, baseOpts);
    }

    if (response.status === 402) {
      throw new PaymentRequiredError(message, baseOpts);
    }

    if (response.status === 403) {
      // 403 can be auth OR quota exceeded (BLOCK overage policy).
      // Finance uses AUTH_002 for both — detect quota by message content.
      if (message.toLowerCase().includes("quota")) {
        throw new QuotaExceededError(message, {
          ...baseOpts,
          quotaLimit,
          quotaRemaining,
          overagePolicy: "BLOCK",
        });
      }
      throw new AuthenticationError(message, baseOpts);
    }

    if (response.status === 404) {
      throw new NotFoundError(message, baseOpts);
    }

    if (response.status === 422) {
      throw new ValidationError(message, baseOpts);
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      const effectiveRetryAfter = retryAfter ? Number.parseFloat(retryAfter) : bodyRetryAfter;

      // Distinguish rate limit from quota exceeded (THROTTLE policy)
      if (message.toLowerCase().includes("quota")) {
        throw new QuotaExceededError(message, {
          ...baseOpts,
          quotaLimit,
          quotaRemaining: 0,
          overagePolicy: "THROTTLE",
        });
      }
      throw new RateLimitError(message, {
        ...baseOpts,
        retryAfter: effectiveRetryAfter,
      });
    }

    if (response.status === 502 || response.status === 503) {
      throw new ServiceUnavailableError(message, baseOpts);
    }

    if (response.status >= 500) {
      throw new ServerError(message, baseOpts);
    }

    throw new APIError(message, baseOpts);
  }

  /** Check API health status. Returns the health check response body. */
  async health(options?: { timeout?: number }): Promise<Record<string, unknown>> {
    const effectiveTimeout = options?.timeout ?? 5000;
    const base = this.baseURL.endsWith("/") ? this.baseURL.slice(0, -1) : this.baseURL;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

    try {
      const response = await fetch(`${base}/health`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "User-Agent": `vectrade-node/${SDK_VERSION}`,
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      if (error instanceof VecTradeError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new TimeoutError(`Health check timed out after ${effectiveTimeout}ms`);
      }
      throw new ConnectionError(error instanceof Error ? error.message : "Health check failed");
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

function parseNumberHeader(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}
