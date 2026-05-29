# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-05-29

### Changed

- **Stable release** — all public APIs finalized, semver enforced from this point

## [0.2.0] - 2026-05-29

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

[Unreleased]: https://github.com/VecTrade-io/vectrade-node/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/VecTrade-io/vectrade-node/compare/v0.2.0...v1.0.0
[0.2.0]: https://github.com/VecTrade-io/vectrade-node/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/VecTrade-io/vectrade-node/releases/tag/v0.1.0
