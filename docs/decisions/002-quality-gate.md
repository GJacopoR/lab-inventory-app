# Decision: Lightweight Quality Gate

## Context

Full E2E testing adds maintenance overhead for a small team.

## Decision

Use static verification (`scripts/verify-pwa.js`) + unit tests (Vitest) + TypeScript check.

## Consequences

- Fast feedback during development
- Minimal maintenance burden
- Some manual verification still required (see MANUAL_CHECKLIST.md)