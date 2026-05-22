# Contributing to @vectrade/sdk

Thank you for your interest in contributing! This guide explains how to set up, develop, test, and submit changes.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm 9+

## Development Setup

```bash
git clone https://github.com/VecTrade-io/vectrade-node.git
cd vectrade-node
npm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build with tsup (ESM + CJS + types) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict checking |
| `npm test` | Run unit tests with Vitest |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run format` | Prettier formatting |
| `npm run format:check` | Check formatting (CI) |
| `npm run bench` | Run benchmarks |
| `npm run clean` | Remove dist/ and coverage/ |

## Running Live Integration Tests

Live tests hit the production API and are skipped by default:

```bash
VECTRADE_API_KEY=vq_your_key npx vitest run tests/live.test.ts
```

## Pull Request Process

1. Fork the repository and create a feature branch from `main`.
2. Write tests for any new functionality.
3. Ensure all checks pass:
   ```bash
   npm run lint && npm run typecheck && npm run format:check && npm test
   ```
4. Update `CHANGELOG.md` under the `[Unreleased]` section.
5. Submit a PR with a clear description of the change.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add new resource`
- `fix: correct retry behavior`
- `docs: update README examples`
- `test: add coverage for edge case`
- `chore: update dependencies`

## Code Style

- TypeScript strict mode with all strict flags enabled
- No runtime dependencies — only devDependencies
- Use native `fetch` API (no axios/node-fetch)
- Use `encodeURIComponent()` for all user-supplied path parameters
- Prettier for formatting, ESLint for linting
- Prefer named exports over default exports

## Testing

We use [Vitest](https://vitest.dev/) with [MSW](https://mswjs.io/) for HTTP mocking:

```bash
npm test                        # All unit tests
npx vitest run tests/live.test.ts  # Live tests (requires VECTRADE_API_KEY)
npx vitest run --coverage       # Coverage report
```

## Architecture

```
src/
├── client.ts         # Core HTTP client with retry, error handling
├── errors.ts         # Typed exception hierarchy
├── index.ts          # Public API surface (re-exports)
├── validate.ts       # Input validation utilities
├── transform.ts      # Response transformations
├── types/            # TypeScript interfaces (from OpenAPI)
└── resources/        # Resource classes (quotes, developer, ai, etc.)
    ├── quotes.ts
    ├── developer.ts
    ├── ai.ts
    └── ...
```

## Runtime Compatibility

The SDK targets Node.js 18+, Deno, Bun, and Cloudflare Workers.
Avoid Node.js-specific APIs — use Web Standards (fetch, crypto.subtle, TextEncoder, etc.).

## Releasing

Releases are automated via [release-please](https://github.com/google-github-actions/release-please-action):

1. Merge PRs to `main` using conventional commits (`feat:`, `fix:`, etc.).
2. release-please automatically creates/updates a Release PR with version bumps and changelog.
3. Merge the Release PR — this creates a GitHub Release with a semver tag.
4. The `publish.yml` workflow triggers on the release, runs CI, and publishes to npm with provenance.

For owner bypass: repository settings allow the owner to push directly to `main` without PR review.
