# @vectrade/sdk

[![License](https://img.shields.io/github/license/VecTrade-io/vectrade-node)](LICENSE) [![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

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
  sandbox: true,              // use sandbox environment
  timeout: 60_000,            // request timeout (ms)
  maxRetries: 3,              // retry on 429/5xx
});
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

## License

MIT — see [LICENSE](LICENSE).
