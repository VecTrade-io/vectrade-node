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
import { VecTrade, RateLimitError, NotFoundError, AuthenticationError } from "@vectrade/sdk";

try {
  const quote = await vt.quotes.get("INVALID");
} catch (e) {
  if (e instanceof NotFoundError) {
    console.log(`Symbol not found (${e.status}): ${e.message}`);
  } else if (e instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${e.retryAfter}s`);
  } else if (e instanceof AuthenticationError) {
    console.log(`Invalid API key: ${e.message}`);
  }
}
```

All errors include `requestId` and `status` for debugging.

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
