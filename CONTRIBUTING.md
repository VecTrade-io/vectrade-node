# Contributing to @vectrade/sdk

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/VecTrade-io/vectrade-node.git
cd vectrade-node
npm install
```

## Scripts

```bash
npm run build        # Build with tsup (ESM + CJS + types)
npm run lint         # ESLint
npm run typecheck    # TypeScript strict checking
npm test             # Run tests with Vitest
npm run test:watch   # Watch mode
npm run format       # Prettier formatting
npm run format:check # Check formatting
```

## Pull Request Process

1. Fork the repository and create a feature branch from `main`.
2. Write tests for any new functionality.
3. Ensure all checks pass: `npm run lint && npm run typecheck && npm test`
4. Update `CHANGELOG.md` under the `[Unreleased]` section.
5. Submit a PR with a clear description of the change.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add new resource`
- `fix: correct retry behavior`
- `docs: update README examples`
- `test: add coverage for edge case`

## Code Style

- TypeScript strict mode with all strict flags enabled
- No runtime dependencies — only devDependencies
- Use native `fetch` API (no axios/node-fetch)
- Use `encodeURIComponent()` for all user-supplied path parameters
- Prettier for formatting, ESLint for linting

## Testing

We use [Vitest](https://vitest.dev/) with [MSW](https://mswjs.io/) for HTTP mocking:

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npx vitest run --coverage   # Coverage report
```

## Runtime Compatibility

The SDK targets Node.js 18+, Deno, Bun, and Cloudflare Workers.
Avoid Node.js-specific APIs — use Web Standards (fetch, crypto.subtle, TextEncoder, etc.).
