# Developer Runbook

## Common Commands

See `README.md` for all commands. Quick reference:
- `npm run dev` - Development server
- `npm run quality` - Full verification (typecheck + test + verify:pwa)

## Release/Deploy Checklist

- [ ] `npm run quality` passes
- [ ] `npm run build` succeeds  
- [ ] Manual smoke test on deployed URL
- [ ] Verify PWA install prompt appears

## Manual Smoke Checks

1. Load `/lab-inventory-app/` - should show login
2. Login and navigate to Dashboard
3. Create a recipe, prepare it, print label
4. Go offline - offline banner should appear
5. Settings → Export (downloads JSON file)
6. Settings → Restore (shows confirmation)

For exhaustive checks, see `MANUAL_CHECKLIST.md`.

## Troubleshooting

| Issue | Action |
|-------|--------|
| TypeScript errors | Run `npx tsc --noEmit`; check imports in `src/models.ts` and `src/domain/` types |
| PWA not installable | Run `npm run verify:pwa`; verify manifest.webmanifest in /dist; check DevTools > Application |
| GitHub Pages 404 on refresh | Verify `/dist/404.html` exists; test `sessionStorage.redirect` handling |
| Service worker not registered | Check browser DevTools > Application > Service Workers; verify `index.html` inline registration |
| Offline not working | Verify NavigationRoute in /dist/sw.js; check network tab for uncached requests |

See `docs/pwa-and-deploy.md` for PWA configuration details.