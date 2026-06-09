# Decision: PWA Setup Strategy

## Context

App needed to be installable as a PWA with offline support.

## Decision

- Use `vite-plugin-pwa` with `generateSW` mode
- Set `registerType: 'prompt'` for user-controlled updates
- Include 192x192 and 512x512 PNG icons
- Add NavigationRoute for SPA fallback

## Consequences

- Installable in modern browsers
- Offline app shell works after first visit
- User must explicitly update (via UpdatePrompt component)