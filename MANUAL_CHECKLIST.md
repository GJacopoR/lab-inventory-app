# Manual Verification Checklist

Use this checklist for features that require manual verification in a browser.

## PWA Installability

- [ ] Chrome/Edge shows "Install" prompt after loading the app
- [ ] Install shows correct app name "Lab Inventory PWA" / "Inventario"
- [ ] Installed app launches correctly (standalone mode, no browser chrome)
- [ ] Icon displays correctly in installed app launcher

## GitHub Pages Deployment

- [ ] Direct navigation to `/inventory-app/recipes/123` works (no 404)
- [ ] Refresh on any route (e.g., `/inventory-app/settings`) loads correctly
- [ ] Service worker registers without errors (Check DevTools > Application)
- [ ] Manifest loads correctly (Check DevTools > Application > Manifest)

## Offline Behavior

- [ ] Offline banner appears when network is disconnected
- [ ] App navigation works when offline (return to dashboard, etc.)
- [ ] Previously loaded pages accessible when offline

## Update Prompt

- [ ] "Nuova versione disponibile" banner appears after deploy (test with dev mode)
- [ ] Clicking "Aggiorna ora" refreshes the app

## Backup/Restore

- [ ] Export button downloads a `.json` file
- [ ] Exported file is valid JSON with `version` and `exportedAt` fields
- [ ] Restore shows confirmation dialog before proceeding
- [ ] Import of valid backup restores data and refreshes the page
- [ ] Import of invalid file shows "File di backup non valido o corrotto" error