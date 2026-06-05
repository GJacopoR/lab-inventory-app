# Decision: Local-First Architecture with Dexie

## Context

App needed offline capability and no backend infrastructure.

## Decision

Use Dexie.js (IndexedDB wrapper) for all persistent data.

## Consequences

- No server dependency; works offline after first load
- Data is device-local; no sync between devices
- Backup/export is the only recovery mechanism