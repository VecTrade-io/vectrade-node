# VecTrade Node SDK — Copilot Instructions

## Workflow

All agents follow the standard workflow defined in `instructions/agent-workflow.instructions.md`:
**Implement → Verify → Changelog → Commit**

## Agents

| Agent | When to Use |
|-------|------------|
| `@vt-sdk-dev` | Implementing/fixing SDK methods |
| `@vt-sdk-tester` | Writing/fixing tests |

## Conventions

- TypeScript 5.x strict mode
- Zero external dependencies (native fetch)
- Dual ESM/CJS via tsup
- Vitest for testing
- JSDoc on all exports
- Resource-based client: `client.quotes.get("AAPL")`

## Build & Test

```bash
npm ci                     # Install
npm run build              # Build (tsup)
npm test                   # Run tests (vitest)
npm run typecheck          # tsc --noEmit
npm run lint               # ESLint
```

## Release

Version in `package.json`. Published to npm on tag push.
