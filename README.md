# @vectrade/sdk

[![CI](https://github.com/VecTrade-io/vectrade-node/actions/workflows/ci.yml/badge.svg)](https://github.com/VecTrade-io/vectrade-node/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@vectrade/sdk)](https://www.npmjs.com/package/@vectrade/sdk)
[![License](https://img.shields.io/github/license/VecTrade-io/vectrade-node)](LICENSE)
[![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

Official TypeScript SDK for the [VecTrade](https://vectrade.io) financial data and AI platform.

## Features

- **Zero runtime dependencies** — uses native `fetch` (Node 18+, Deno, Bun, Cloudflare Workers)
- **Full TypeScript support** — generated types from OpenAPI spec
- **Streaming AI analysis** — AsyncGenerator-based streaming
- **Webhook verification** — built-in HMAC signature validation
- **Automatic retries** — exponential backoff on 429/5xx

## Installation

```bash
npm install @vectrade/sdk
# or
pnpm add @vectrade/sdk
```

## Authentication

All API requests require a valid API key passed via the `X-API-Key` header. The SDK handles this automatically.

### Getting Your API Key

1. Sign up at [vectrade.io/register](https://vectrade.io/register) (free tier includes 10,000 requests/month)
2. Navigate to [Developer Dashboard](https://vectrade.io/vtrade/developer) to view/create keys
3. Keys follow the format `vq_<random>` (e.g., `vq_xS42eF9Pa9ZOD3MRwuszYf5tTmdrEP7...`)

### Configuring the SDK

```typescript
import { VecTrade } from "@vectrade/sdk";

// Option 1: Environment variable (recommended)
// Set VECTRADE_API_KEY=vq_live_...
const vt = new VecTrade(); // auto-reads VECTRADE_API_KEY

// Option 2: Explicit parameter
const vt2 = new VecTrade({ apiKey: "vq_live_..." });
```

> **Security:** Never hardcode API keys in source code. Use environment variables or a secrets manager.

### Plan Limits & Enforcement

Each API key is bound to a subscription plan with the following enforced limits:

| Limit | Free | Standard | Professional |
|-------|------|----------|--------------|
| API calls/month | 10,000 | 100,000 | 500,000 |
| Requests/minute (RPM) | 20 | 120 | 300 |
| Requests/second (RPS) | 2 | 10 | 25 |
| Monthly tokens | — | 1,000,000 | 5,000,000 |
| AI prompts/day | 5 | Unlimited | Unlimited |
| API keys | 1 | 5 | 20 |
| Key scopes | ✓ | ✓ | ✓ |

When a limit is exceeded, the API returns a `429` status with a descriptive error body.

### Error Responses for Auth Issues

| Scenario | HTTP Status | SDK Exception |
|----------|------------|---------------|
| Missing API key | 401 | `AuthenticationError` |
| Invalid/expired/revoked key | 403 | `AuthenticationError` |
| Monthly quota exceeded | 429 | `QuotaExceededError` |
| Token quota exceeded | 429 | `QuotaExceededError` |
| RPM/RPS rate limit exceeded | 429 | `RateLimitError` |
| AI access denied (plan) | 403 | `PaymentRequiredError` |
| AI daily limit exceeded | 429 | `QuotaExceededError` |
| Scope denied (key restriction) | 403 | `AuthenticationError` |

## Quick Start

```typescript
import { VecTrade } from "@vectrade/sdk";

const vt = new VecTrade(); // reads VECTRADE_API_KEY from env

// Get a quote
const quote = await vt.quotes.get("AAPL");
console.log(`${quote.symbol}: $${quote.price}`);

// Stream AI analysis
for await (const chunk of vt.ai.stream("Analyze AAPL for long-term hold")) {
  process.stdout.write(chunk.text);
}
```

## Configuration

```typescript
const vt = new VecTrade({
  apiKey: "vq_live_...",      // or set VECTRADE_API_KEY
  baseURL: "https://...",     // custom endpoint (optional)
  timeout: 60_000,            // request timeout (ms)
  maxRetries: 3,              // retry on 429/5xx
});
```

## Available Resources

| Resource | Description |
|----------|-------------|
| `vt.quotes` | Real-time and historical price quotes |
| `vt.fundamentals` | Financial statements, ratios, company profiles |
| `vt.technicals` | Technical indicators (RSI, MACD, Bollinger, etc.) |
| `vt.news` | Market news and sentiment |
| `vt.earnings` | Earnings reports and estimates |
| `vt.analyst` | Analyst ratings and price targets |
| `vt.insider` | Insider trading activity |
| `vt.options` | Options chains and Greeks |
| `vt.screener` | Stock screener with auto-pagination |
| `vt.webhooks` | Webhook management for real-time alerts |
| `vt.developer` | API key and usage management |
| `vt.ai` | AI-powered streaming analysis |

## Error Handling

The SDK throws typed errors for all API failures:

```typescript
import {
  VecTrade,
  RateLimitError,
  NotFoundError,
  AuthenticationError,
  QuotaExceededError,
  PaymentRequiredError,
} from "@vectrade/sdk";

try {
  const quote = await vt.quotes.get("INVALID");
} catch (e) {
  if (e instanceof AuthenticationError) {
    // 401/403: invalid key, expired, revoked, or scope denied
    console.error(`Auth failed: ${e.message}`);
  } else if (e instanceof PaymentRequiredError) {
    // 403: AI features not included in plan
    console.error(`Upgrade required: ${e.message}`);
  } else if (e instanceof QuotaExceededError) {
    // 429: monthly quota, token quota, or AI daily limit exhausted
    console.error(`Quota exhausted: ${e.message} (policy: ${e.overagePolicy})`);
  } else if (e instanceof RateLimitError) {
    // 429: RPM or RPS rate limit exceeded
    console.error(`Rate limited. Retry after ${e.retryAfter}s`);
  } else if (e instanceof NotFoundError) {
    // 404: resource not found
    console.error(`Not found: ${e.message}`);
  }
}
```

All errors include `requestId`, `status`, and `errorCode` for debugging.

## Developer Self-Service

Manage your API keys and monitor usage programmatically:

```typescript
// Check your plan and quota
const plan = await vt.developer.getPlan();
console.log(`Plan: ${plan.plan_name}, Quota: ${plan.monthly_quota}`);
console.log(`AI: ${plan.includes_ai}, Tokens: ${plan.monthly_tokens}`);

const quota = await vt.developer.getQuota();
console.log(`Used: ${quota.used}/${quota.monthly_quota} (${quota.usage_pct}%)`);

// Check usage with token tracking
const usage = await vt.developer.getUsage();
console.log(`Tokens: ${usage.tokens_used}/${usage.token_quota}`);

// Manage API keys
const keys = await vt.developer.listKeys();
const newKey = await vt.developer.createKey({ label: "production", scopes: ["quotes", "options"] });
await vt.developer.revokeKey(newKey.id);
```

## Webhooks

```typescript
import { verifyWebhook } from "@vectrade/sdk/webhooks";

const event = await verifyWebhook(rawBody, headers, process.env.WEBHOOK_SECRET!);
console.log(event.type); // "quote.alert.triggered"
```

## Runtime Support

| Runtime | Version |
|---------|---------|
| Node.js | ≥ 18 |
| Deno | ≥ 1.28 |
| Bun | ≥ 1.0 |
| Cloudflare Workers | ✓ |

## Documentation

Full documentation is available at [docs.vectrade.io/sdks/typescript](https://docs.vectrade.io/sdks/typescript).

- [API Reference](https://docs.vectrade.io/api-reference/overview)
- [Authentication Guide](https://docs.vectrade.io/guides/authentication)
- [Error Handling](https://docs.vectrade.io/guides/error-handling)
- [Streaming Guide](https://docs.vectrade.io/guides/streaming)

## License

MIT — see [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.
