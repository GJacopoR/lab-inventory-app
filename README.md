# Lab Inventory PWA

A local-first Progressive Web App for kitchen/lab inventory and recipe management.

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Dexie.js** (IndexedDB wrapper) for local data
- **Tailwind CSS** for styling
- **React Router v6** for navigation
- **vite-plugin-pwa** for service worker and manifest

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173
```

## Quality Gate

```bash
npm run typecheck    # TypeScript check
npm run test         # Unit tests (Vitest)
npm run verify:pwa   # Static PWA verification
npm run quality      # Run all: typecheck + test + verify:pwa
```

## Build & Deploy

```bash
npm run build      # Build to /dist
GITHUB_PAGES=true npm run build  # Build with /lab-inventory-app/ base path
npm run deploy     # Deploy to GitHub Pages (gh-pages branch)
```

## Features

- **Inventory tracking** with lot management and expiry dates
- **Recipe management** with ingredient lists and preparations
- **Label printing** with preparation-based workflow
- **Offline support** via service worker
- **Data backup/restore** for safety

See `docs/` for detailed documentation.