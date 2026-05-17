# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in the VecTrade Node SDK, please report it responsibly:

1. **Do NOT** open a public GitHub issue.
2. Email **security@vectrade.io** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge your report within 48 hours and provide a timeline for a fix.

## Scope

This policy covers the `@vectrade/sdk` npm package. For API-level security issues (authentication, authorization, data exposure), please also contact security@vectrade.io.

## Best Practices for SDK Users

- Never hardcode API keys in source code. Use environment variables (`VECTRADE_API_KEY`).
- Pin SDK versions in production (`@vectrade/sdk@0.1.0`).
- Keep the SDK updated to receive security patches.
- Use the webhook verification utility to validate incoming webhook payloads.
