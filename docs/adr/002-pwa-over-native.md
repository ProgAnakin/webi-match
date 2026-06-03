# ADR 002 — PWA over Native iOS App

**Date:** 2026-04-01  
**Status:** Accepted

## Context

Swipey is a kiosk experience designed to run on company-owned iPads installed at Swipey locations. The deployment model needs to be:

- **Instant update** — when a bug is fixed or a product is added, all store iPads should reflect the change without manual intervention.
- **No App Store dependency** — submissions, reviews and enterprise certificates introduce operational overhead that slows product iteration.
- **Same codebase as the manager dashboard** — the manager accesses `/manager` from the same origin; a native app would require a separate web view or separate app.

## Decision

**PWA (Progressive Web App)** deployed on Vercel, accessed in fullscreen via "Add to Home Screen" on iPad.

Capacitor is kept as a dependency in `package.json` (`cap:ios` / `cap:android` scripts) to allow a future native build if App Store distribution becomes a requirement.

## Rationale

| Concern | Native iOS app | PWA |
|---|---|---|
| Deployment | App Store review (1-3 days) or MDM push | `git push` → Vercel → live in < 60s |
| Update propagation | Manual update per device or MDM | Service worker — next visit gets new build |
| Fullscreen kiosk mode | Native, reliable | "Add to Home Screen" + `apple-mobile-web-app-capable` — matches native visually |
| Web APIs needed | Wake Lock, Web Audio, visualViewport — all available in WKWebView | Same APIs, native browser |
| Certificate management | Enterprise certificate or Developer account | None |
| Team overhead | iOS developer + App Store account | Web deploy — existing workflow |

The only material limitation of PWA on iPad is the keyboard behaviour in fullscreen: when the virtual keyboard rises, WKWebView can expose the browser URL bar. This was addressed by setting `interactive-widget=resizes-content` in the viewport meta and using `visualViewport` API to compute keyboard height as a CSS variable (`--keyboard-height`).

## Consequences

- Deployments are zero-touch: push to `main`, all iPads get the update on next page load or service worker refresh.
- `vite-plugin-pwa` generates the service worker and manifest. Runtime caching is configured for images and API responses.
- iOS splash screens are declared in `index.html` with per-device media queries for all current iPad models.
- Wake lock (`navigator.wakeLock`) prevents the screen from sleeping during a session.
- If a native distribution channel becomes necessary (e.g. MDM kiosk mode via Apple Configurator), the Capacitor scripts allow wrapping the same web build without changing the application code.
