# Decision: GitHub Pages Deployment Strategy

## Context

Need reliable deployment to GitHub Pages with SPA routing.

## Decision

- Set base path via `GITHUB_PAGES=true npm run build`
- Use relative manifest paths (`.`)
- 404.html saves route to `sessionStorage` and redirects to base
- Custom service worker registration detects environment

## Consequences

- Works locally without env var (`/` base path)
- Works on GitHub Pages (`/inventory-app/` base path)
- Deep links refresh correctly