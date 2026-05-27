# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 (2026-05-27)


### ⚠ BREAKING CHANGES

* Auth header changed from Authorization: Bearer to X-API-Key

### Features

* add free plan tier config for AI lockdown ([2c92f9c](https://github.com/VecTrade-io/vectrade-node/commit/2c92f9c19adfdf317209e360b59e8f0d172f101b))
* add new resources (etf, historical, profile, sentiment) ([256a630](https://github.com/VecTrade-io/vectrade-node/commit/256a6303fd262f9f6aa2911fa5c80579abf256a2))
* add VecTrade Core format tests and tier config module ([7621d0d](https://github.com/VecTrade-io/vectrade-node/commit/7621d0dbee6cc6adb24a8d8400bae6dbd7e3567e))
* align SDK with auth gateway and add comprehensive live tests ([c0655a9](https://github.com/VecTrade-io/vectrade-node/commit/c0655a94d942cbc062cff11012b094f296fb8a24))
* fifth-pass hardening — exports, tests, robustness ([b2bfeb8](https://github.com/VecTrade-io/vectrade-node/commit/b2bfeb8a3d4357de9cedc4d3803d0b4823668d86))
* fourth-pass professional hardening ([6ff3129](https://github.com/VecTrade-io/vectrade-node/commit/6ff3129c6145f3bee8ae01e23e0a1f600686d01f))
* industrial-grade hardening ([d45a3c2](https://github.com/VecTrade-io/vectrade-node/commit/d45a3c2a0589d57a6d245599432f799a8b6648d0))
* publication readiness audit ([b6dd933](https://github.com/VecTrade-io/vectrade-node/commit/b6dd933bf6a4171b1b173f8df7b9e238e49c22ae))
* typed error hierarchy and project scaffolding ([1948a95](https://github.com/VecTrade-io/vectrade-node/commit/1948a95e0a9e6a79916c762bf71aa956c89c3f96))


### Bug Fixes

* add ESLint 9 flat config for CI ([0a73276](https://github.com/VecTrade-io/vectrade-node/commit/0a732768d6d5faa515a5d93d20ddef927aa443fa))
* align tests with implementation (sandbox URL, response meta, transform) ([39afc1c](https://github.com/VecTrade-io/vectrade-node/commit/39afc1ccceff2c7d5bc5bf22f7233eec4dca766b))
* handle 204 No Content responses in client request method ([f9bdb18](https://github.com/VecTrade-io/vectrade-node/commit/f9bdb18f3a7b2e6f56cf7cd137b154ea4d723510))
* replace pnpm with npm in prepublishOnly ([14b5838](https://github.com/VecTrade-io/vectrade-node/commit/14b583811c5c464e52addb38bb4da54e2a808880))
* update homepage URL to docs.vectrade.io ([ddefc6b](https://github.com/VecTrade-io/vectrade-node/commit/ddefc6bb23258008484334100903ee512fd311be))

## [Unreleased]

### Added

- Auth gateway error format parser (first-priority) for structured error responses
- `PaymentRequiredError` mapped from `ai_access_denied` (403)
- `QuotaExceededError` mapped from `token_quota_exceeded` and `ai_daily_limit_exceeded` (429)
- Developer self-service types: `PlanResponse`, `UsageResponse`, `QuotaResponse` aligned with production API
- Live integration test suite (`tests/live.test.ts`) with 14 tests covering auth errors, developer endpoints, quotes, scope enforcement, key lifecycle, and response metadata
- Scope enforcement tests: creates scoped key, verifies allowed/denied access, revocation propagation
- Authentication section in README with plan limits table and error mapping reference
- CI workflow for live integration tests (manual trigger + weekly schedule)
- `release-please` workflow for automated versioning and changelogs

### Changed

- **BREAKING:** Auth header changed from `Authorization: Bearer <key>` to `X-API-Key: <key>` to match API gateway
- Developer resource response types now use `snake_case` matching raw API responses
- Error detail extraction uses `Object.fromEntries` filter (removes lint warnings)

### Fixed

- SDK requests were rejected by auth gateway (wrong header format)
- 403 `ai_access_denied` now correctly maps to `PaymentRequiredError` instead of generic `AuthenticationError`
- 429 `token_quota_exceeded` and `ai_daily_limit_exceeded` now map to `QuotaExceededError` with policy type

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
