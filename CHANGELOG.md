# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-17

### Added

- Initial release of the VecTrade TypeScript SDK
- Full TypeScript support with strict types
- Zero runtime dependencies — uses native `fetch` (Node 18+, Deno, Bun, Workers)
- Resources: quotes, fundamentals, technicals, news, earnings, insider, analyst, options, screener, developer, webhooks
- AI streaming analysis with AsyncGenerator interface
- Automatic retries with exponential backoff and jitter on 429/5xx
- Typed exception hierarchy matching API error codes
- Webhook HMAC verification with replay attack protection
- Paginator for auto-paginated endpoints (screener)
- CI: GitHub Actions with Node 18/20/22 matrix
- npm provenance publishing workflow

[Unreleased]: https://github.com/VecTrade-io/vectrade-node/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/VecTrade-io/vectrade-node/releases/tag/v0.1.0
