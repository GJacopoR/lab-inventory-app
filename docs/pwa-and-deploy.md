# PWA & Deployment

## PWA Configuration

- **vite-plugin-pwa** generates `sw.js`, `workbox-*.js`, `manifest.webmanifest`
- **Manifest**: `start_url: '.'`, `scope: '.'` (relative for base path support)
- **Icons**: `pwa-192x192.png` and `pwa-512x512.png` in `/public/`
- **Service worker registration**: Custom inline script in `index.html:12-23`, detects GitHub Pages path at runtime

## Build Output

After `npm run build`:
- `/dist/index.html` - Main entry (includes inline SW registration)
- `/dist/manifest.webmanifest` - PWA manifest
- `/dist/sw.js` - Workbox service worker with NavigationRoute for SPA fallback
- `/dist/workbox-*.js` - Workbox runtime
- `/dist/pwa-*.png` - Icons
- `/dist/404.html` - GitHub Pages SPA fallback

## GitHub Pages Strategy

- **Base path**: `/lab-inventory-app/` (set via `GITHUB_PAGES=true` env var before `npm run build`)
- **404 fallback**: `public/404.html` saves `sessionStorage.redirect` then redirects to `/lab-inventory-app/`
- **SPA routing**: React Router uses `import.meta.env.BASE_URL` for dynamic basename; NavigationRoute in sw.js serves `index.html` for navigation requests

## Deployment

```bash
# From project root
GITHUB_PAGES=true npm run build  # Build with correct base paths
npm run deploy                   # Deploys /dist to gh-pages branch
```

Requires GitHub Pages live at `https://gjacopor.github.io/lab-inventory-app/`.

## Known Constraints

- Service worker scope determined at runtime (detects `/lab-inventory-app/` path)
- Offline limited to app shell + cached assets (no server sync)
- Update prompt requires user click (registerType: 'prompt')
- **Cache note**: If old `/inventory-app/` paths cached, hard refresh or clear site data required