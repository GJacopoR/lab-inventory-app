# AI Coding Assistant Guide

## Project Overview

Lab Inventory PWA - React + TypeScript + Vite + Dexie (IndexedDB) for local-first inventory management. Target deployment: GitHub Pages at `/lab-inventory-app/`.

## Common Commands

See `README.md` for key commands and `docs/runbook.md` for the full command checklist.

## Architecture Map

- **Shell**: `src/components/ui/AuthenticatedShell.tsx` - Flex layout, responsive nav
- **Router**: `src/App.tsx` - Protected routes wrapper
- **Auth**: `src/auth/AuthContext.tsx` - Role-based capabilities (see below)
- **DB**: `src/repositories/db.ts` - 13 Dexie tables (see `docs/architecture.md` for schema)
- **PWA config**: `vite.config.mts` - base path via GITHUB_PAGES env var
- **Backup**: `src/repositories/backupRepository.ts` (export/import, validation)
- **Pages**: `src/pages/` - Dashboard, Inventory, Recipes, Labels, Settings, Documents

**Key flows**: See `docs/architecture.md` for diagram of label preview flow.

## Role-Based Permissions

Roles are hierarchical: `lettura` < `operatore` < `admin`.

| Capability | lettura | operatore | admin |
|------------|---------|-----------|-------|
| canRead | ✓ | ✓ | ✓ |
| canCreate | ✗ | ✓ | ✓ |
| canEdit | ✗ | ✓ | ✓ |
| canDelete | ✗ | ✗ | ✓ |
| canAccessSettings | ✗ | ✗ | ✓ |
| canPrintLabels | ✓ | ✓ | ✓ |

**Demo credentials** (for development phase):
- Username: `admin`, `operatore`, or `lettura`
- Password: `password`

**Note**: Demo usernames happen to match role names, but this is temporary. Permissions are derived from the `role` field in the user record, not the username.

## Mobile vs Desktop Behavior

**Mobile navigation** (`AuthenticatedShell.tsx`):
- Hamburger menu toggles mobile nav panel
- Panel closes on: outside click, Escape key, or navigation
- Logout button visible in mobile nav (was missing before)
- Animated via `animate-slide-down` CSS class

**Desktop navigation**:
- Persistent sidebar on left
- Logout button in sidebar footer
- No animation on nav open/close

## RBAC Enforcement

Permission checks use `useCapabilities()` hook which reads from `AuthContext`. Enforcement happens in:

- **Route protection** (`ProtectedRoute.tsx`): `/settings` blocked for non-admin roles
- **Navigation filtering** (`AuthenticatedShell.tsx`): Settings link hidden for non-admin
- **UI action visibility** (`InventoryTable.tsx`, `Recipes.tsx`, `RecipeDetail.tsx`, `Documents.tsx`): Create/Edit/Delete buttons hidden based on `canCreate`/`canEdit`/`canDelete`
- **Runtime guards**: All handler functions check capabilities before executing mutations (e.g., `handleAddLot`, `handleEditLot`, `handleDeleteLot`, `saveDocument`, `createInventoryFromItems`)

**Key enforcement points**:
- `+ Lotto` button: `canCreate` required
- `Modifica`/`Elimina` lot buttons: `canEdit`/`canDelete` required
- OCR upload area: `canCreate` required (invisible for lettura)
- Recipes create button: `canCreate` required
- Recipe preparation form: `canCreate` required
- Documents "Aggiungi riga": `canCreate` required
- Documents "Crea lotti inventario": `canCreate` required

## Critical Invariants

1. All data lives in IndexedDB (no external API)
2. `LabelPreviewModal` is the **single source of truth** for label preview/print - uses `print-none` and `print-label` CSS classes
3. Service worker registration is **inline in index.html** (not auto-injected) - detects `/lab-inventory-app/` path at runtime
4. Manifest uses **relative paths** (`.`) for GitHub Pages compatibility
5. Build with `GITHUB_PAGES=true` for correct base paths
6. Recipe preparations auto-print on Labels page via `window.print()` after 500ms when `?prep=` URL param present

**Cache note**: After broken deployments, users may need hard refresh or clear site data to remove stale service workers.

## Sensitive Components

- **Do not** modify `vite.config.mts` PWA settings without testing installability
- **Do not** change `LabelPreviewModal` without checking print output (both modal preview and print-only `.print-label` div)
- **Do not** alter `public/404.html` without testing deep-link refresh
- `src/repositories/db.ts` schemas are live - changes require migration logic

## Verify Before Completion

- `npm run quality` passes
- Types: `npx tsc --noEmit` (no errors)
- Build: `npm run build` (no errors)
- PWA: `npm run verify:pwa` (all checks pass)
- Manual smoke test for the changed feature

## Report Work

Follow the pattern:
1. What was incomplete/corrected
2. Exact files changed
3. Fixes applied
4. Build/TypeScript/test results
5. Confirmation of feature stability

## Change Protocol

When a task changes behavior, architecture, commands, or constraints, update the relevant documentation in the same task.

Use this rule:

- Update `README.md` if setup, scripts, feature overview, or developer-facing usage changed
- Update `docs/architecture.md` if flows, component responsibilities, data model, or table coverage changed
- Update `docs/pwa-and-deploy.md` if manifest, service worker, routing, GitHub Pages, build/deploy, or base path behavior changed
- Update `docs/data-safety.md` if backup/export/restore scope, validation, overwrite behavior, or limitations changed
- Update `docs/runbook.md` if operational commands, smoke checks, or troubleshooting steps changed
- Update `docs/decisions/*.md` if a structural decision changed or a new long-lived technical decision was introduced
- Update `AGENTS.md` if invariants, sensitive components, verification rules, or AI workflow expectations changed

Do not duplicate documentation across files. Prefer updating the canonical document and linking to it from other docs.

If a change affects a sensitive area, check docs before editing code and update docs before claiming completion.

Sensitive areas include:
- `src/repositories/db.ts`
- `src/repositories/backupRepository.ts`
- `vite.config.mts` (base path/PWA settings)
- `index.html` (service worker registration)
- `public/404.html` (SPA fallback)
- `src/main.tsx` (router basename via import.meta.env.BASE_URL)
- `src/components/ui/LabelPreviewModal.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/AuthenticatedShell.tsx`
- `src/util/ocr.ts` (OCR pipeline — changes affect all document parsing; verify against real invoices)

Every completion report must include:
1. Docs impacted: yes/no
2. Exact doc files updated
3. Invariants changed: yes/no
4. Any new limitation or operator-facing behavior introduced