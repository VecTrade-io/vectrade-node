/** Base error class for all VecTrade SDK errors. */
export class VecTradeError extends Error {
  readonly requestId?: string | undefined;

  constructor(message: string, options?: { requestId?: string | undefined }) {
    super(message);
    this.name = "VecTradeError";
    this.requestId = options?.requestId;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      requestId: this.requestId,
    };
  }
}

/** Raised when the SDK is misconfigured. */
export class ConfigurationError extends VecTradeError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/** Raised when the API returns an error response. */
export class APIError extends VecTradeError {
  readonly status: number;
  /** Machine-readable error code from the API (e.g. AUTH_001, RL_001). */
  readonly errorCode?: string | undefined;
  /** Additional error context from the API. */
  readonly details?: Record<string, unknown> | undefined;

  constructor(
    message: string,
    options: {
      status: number;
      requestId?: string | undefined;
      errorCode?: string | undefined;
      details?: Record<string, unknown> | undefined;
    }
  ) {
    super(message, { requestId: options.requestId });
    this.name = "APIError";
    this.status = options.status;
    this.errorCode = options.errorCode;
    this.details = options.details;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      status: this.status,
      errorCode: this.errorCode,
      details: this.details,
    };
  }
}

/** Raised on 401/403 responses. */
export class AuthenticationError extends APIError {
  constructor(
    message: string,
    options: {
      status: number;
      requestId?: string | undefined;
      errorCode?: string | undefined;
    }
  ) {
    super(message, options);
    this.name = "AuthenticationError";
  }
}

/** Raised on 429 responses. */
export class RateLimitError extends APIError {
  readonly retryAfter?: number | undefined;

  constructor(
    message: string,
    options: {
      status: number;
      requestId?: string | undefined;
      errorCode?: string | undefined;
      retryAfter?: number | undefined;
    }
  ) {
    super(message, options);
    this.name = "RateLimitError";
    this.retryAfter = options.retryAfter;
  }
}

/** Raised on 404 responses. */
export class NotFoundError extends APIError {
  constructor(
    message: string,
    options: {
      status: number;
      requestId?: string | undefined;
      errorCode?: string | undefined;
    }
  ) {
    super(message, options);
    this.name = "NotFoundError";
  }
}

/** Raised on 422 responses (invalid request parameters). */
export class ValidationError extends APIError {
  constructor(
    message: string,
    options: {
      status: number;
      requestId?: string | undefined;
      errorCode?: string | undefined;
      details?: Record<string, unknown> | undefined;
    }
  ) {
    super(message, options);
    this.name = "ValidationError";
  }
}

/** Raised when API quota is exhausted (403 BLOCK or 429 THROTTLE). */
export class QuotaExceededError extends APIError {
  readonly quotaLimit?: number | undefined;
  readonly quotaRemaining?: number | undefined;
  readonly overagePolicy?: string | undefined;

  constructor(
    message: string,
    options: {
      status: number;
      requestId?: string | undefined;
      errorCode?: string | undefined;
      quotaLimit?: number | undefined;
      quotaRemaining?: number | undefined;
      overagePolicy?: string | undefined;
    }
  ) {
    super(message, options);
    this.name = "QuotaExceededError";
    this.quotaLimit = options.quotaLimit;
    this.quotaRemaining = options.quotaRemaining;
    this.overagePolicy = options.overagePolicy;
  }
}

/** Raised when a paid plan is required (HTTP 402). */
export class PaymentRequiredError extends APIError {
  constructor(
    message: string,
    options: {
      status: number;
      requestId?: string | undefined;
      errorCode?: string | undefined;
    }
  ) {
    super(message, options);
    this.name = "PaymentRequiredError";
  }
}

/** Raised on 5xx responses. */
export class ServerError extends APIError {
  constructor(
    message: string,
    options: {
      status: number;
      requestId?: string | undefined;
      errorCode?: string | undefined;
    }
  ) {
    super(message, options);
    this.name = "ServerError";
  }
}

/** Raised when the service is temporarily unavailable (502/503). */
export class ServiceUnavailableError extends ServerError {
  constructor(
    message: string,
    options: {
      status: number;
      requestId?: string | undefined;
      errorCode?: string | undefined;
    }
  ) {
    super(message, options);
    this.name = "ServiceUnavailableError";
  }
}
