# CONSULTANT.md

## Purpose

This file gives a new AI consultant the minimum complete context needed to resume work on the **Lab Inventory PWA** without losing architectural intent, deployment assumptions, or recent debugging history.

Use it as the first orientation document before proposing code changes, milestone plans, or documentation updates.

***

## Project Summary

**Lab Inventory PWA** is a local-first web application for lab / food-production inventory workflows.

Core stack:
- React
- TypeScript
- Vite
- Dexie + IndexedDB
- React Router
- Vite PWA plugin
- GitHub Pages deployment

Primary architectural intent:
- no external backend/API
- all operational data stored locally in IndexedDB
- stable preparation / label / archive workflow
- printable label flow with consistent preview behavior
- deployable as a GitHub Pages-hosted PWA

***

## Current App Priorities

The project is currently past the broad UI restructuring phase and has recently completed:
- layout / shell improvements
- label flow cleanup
- print flow fixes
- responsiveness pass
- documentation hardening
- GitHub Pages deployment debugging

Near-term priority is not broad redesign, but **reliability, consistency, and operational clarity**.

Recommended framing for future work:
1. preserve working flows
2. avoid unnecessary architectural churn
3. improve reliability before adding large new features
4. keep docs aligned with code in the same pass

***

## Core Functional Areas

Main user-visible areas include:
- Dashboard
- Inventory
- Recipes
- Labels
- Settings
- Documents

Important workflow concepts:
- recipes can produce preparations
- preparations feed label generation / preview / print flow
- historical data must remain consistent across recipe detail, labels, and archive/history views
- backup / restore is a critical safety feature

***

## Important Technical Facts

### Data model
- IndexedDB is the system of record
- Dexie database is defined in `src/repositories/db.ts`
- The live schema currently includes **13 tables**
- There are legacy tables (`lots`, `movements`) that are documented as legacy and are **not included in backup/export scope**
- Any schema change in `db.ts` requires explicit migration thinking

### Label preview / print
- `src/components/ui/LabelPreviewModal.tsx` is the **single source of truth** for label preview/print UI
- The modal uses print-specific classes such as `print-none` and `.print-label`
- There are **two preview modes**:
  1. inline/manual modal preview path
  2. Labels-page auto-open + auto-print path
- On the Labels page, when a `?prep=` URL parameter is present, the app auto-triggers `window.print()` after a short delay (currently 500ms)

### App bootstrap / routing
- App bootstrap happens in `src/main.tsx`
- IndexedDB initialization runs before React render via `initDb()`
- `BrowserRouter` should use `basename={import.meta.env.BASE_URL}` so local dev and GitHub Pages both work correctly

### PWA / service worker
- PWA uses `vite-plugin-pwa`
- Service worker registration is handled inline in `index.html` (not auto-injected)
- Service worker / manifest / deploy path assumptions must stay aligned with the actual GitHub Pages base path
- Changes to PWA behavior should be tested carefully because stale SW/cache can create confusing false failures

***

## Deployment Reality

### Correct public URL
The real GitHub Pages URL is:

`https://gjacopor.github.io/lab-inventory-app/`

This matters because an earlier deployment failure came from using the wrong guessed base path (`/inventory-app/`) instead of the actual repo path (`/lab-inventory-app/`).

### Correct deployment assumptions
- GitHub Pages project-site path is `/lab-inventory-app/`
- Vite GitHub Pages build must use that exact base path
- Router basename must align with `import.meta.env.BASE_URL`
- Any path-sensitive file must agree with the same base path:
  - `vite.config.mts`
  - `index.html`
  - `public/404.html`
  - any router basename logic
  - any docs mentioning the deploy path

### Deployment flow
Current expected flow:
1. run quality checks
2. build with GitHub Pages env enabled
3. deploy built `dist/` to `gh-pages`
4. GitHub Pages serves the `gh-pages` branch

The team has used a CLI deploy flow via `gh-pages`; verify the repo is not simultaneously relying on a conflicting second deployment mechanism before changing anything.

***

## Sensitive Files

Treat changes here as high-risk and verify behavior carefully afterward:
- `src/repositories/db.ts`
- `src/repositories/backupRepository.ts`
- `src/components/ui/LabelPreviewModal.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/AuthenticatedShell.tsx`
- `vite.config.mts`
- `index.html`
- `public/404.html`
- `src/main.tsx`

***

## Documentation Map

Canonical documents already exist. Prefer updating them rather than creating duplicates.

Primary docs:
- `README.md` — overview, stack, commands, feature summary
- `docs/architecture.md` — structure, flows, table mapping, label flow
- `docs/pwa-and-deploy.md` — PWA config, GitHub Pages deploy behavior
- `docs/data-safety.md` — backup/restore scope and limits
- `docs/runbook.md` — operational checks and troubleshooting
- `AGENTS.md` — concise AI coding assistant instructions and invariants
- `docs/decisions/*.md` — architectural decisions / ADRs

### Documentation rule
When code changes behavior, architecture, commands, constraints, or deploy assumptions, update the relevant docs **in the same task**.

Do not duplicate the same explanation in multiple places unless the shorter file clearly links back to the canonical one.

***

## Known Lessons From Recent Debugging

1. **GitHub Pages base path must match the actual repo path exactly.**
   Do not guess it from memory.

2. **A working local app can still fail on Pages if Vite base path and router basename diverge.**

3. **PWA/service worker debugging can be misleading because stale caches and old registrations can survive deployments.**
   When diagnosing deploy issues, consider cache/SW interference early.

4. **Documentation drift is a real risk.**
   Deployment, path, and routing fixes must be reflected in docs immediately.

***

## Working Style Expected From Future Consulting

When asked to guide the project, prefer this approach:
- inspect current implementation first
- avoid speculative redesign
- protect existing working flows
- propose the next smallest meaningful milestone
- separate reliability work from new-feature work
- document invariants explicitly
- when debugging, identify root cause before broad fixes

Good milestone style:
- narrow scope
- explicit verification list
- exact files likely impacted
- no broad refactor unless clearly justified

***

## Typical Verification Checklist

Before considering a task complete, verify as relevant:
- `npm run quality`
- `npx tsc --noEmit`
- `npm run build`
- `npm run verify:pwa`
- manual smoke test of the changed workflow
- for deployment/path changes: local run + GitHub Pages path assumptions
- for print changes: actual print output
- for DB changes: schema / migration / backup implications

***

## What A New Consultant Should Read First

If starting a fresh conversation, read in this order:
1. `CONSULTANT.md`
2. `README.md`
3. `AGENTS.md`
4. `docs/architecture.md`
5. `docs/pwa-and-deploy.md`
6. relevant ADR(s)

Then inspect the actual code before recommending changes.

***

## Current Baseline

As of the latest confirmed state:
- app works locally
- GitHub Pages path issue has been diagnosed and corrected to `/lab-inventory-app/`
- `BrowserRouter` should be environment-aware via `import.meta.env.BASE_URL`
- documentation has been updated to reflect the corrected GitHub Pages setup
- next work should be careful, incremental, and verified