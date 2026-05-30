# Changelog

All notable changes to Webi-Match are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [SemVer](https://semver.org/spec/v2.0.0.html).

---

## [1.6.4] — 2026-05-30

### Fixed
- **E2E suite now actually runs in CI.** The Playwright job had been failing
  since it was written: `playwright.config.ts` defines a single `ipad-landscape`
  (iPad Pro 11) project that runs on **WebKit**, but CI and `test:e2e:install`
  installed **Chromium** only — so the browser could never launch
  (`Executable doesn't exist at .../webkit-.../pw_run.sh`). Install WebKit in
  both places. Suite is green 8/8.
- **E2E specs hardened.** Dropped `networkidle` waits (the `/stats` and
  `/manager` realtime channels keep the network busy forever against the
  placeholder backend), added language-independent crash detection via an
  `error-boundary` testid, and switched the console-error check from a fragile
  benign-string allowlist to a code-fault denylist (TypeError, ReferenceError,
  …) that surfaces the offending message.
- The `Playwright E2E` job is once again a **required gate** (H7) now that it
  passes for real.

### Changed
- **Dependencies updated** via Dependabot: production minor/patch group
  (14 updates incl. `@supabase/supabase-js`, `framer-motion`, Radix, Sentry),
  dev-dependencies group (11 updates), and GitHub Actions
  (`checkout` v6, `setup-node` v6, `upload-artifact` v7). Major bumps
  (react-router-dom v7, lucide-react v1, tailwind-merge v3) deliberately
  deferred and Dependabot configured to stop auto-raising majors.

### Known issues
- `npm audit` reports 2 moderate advisories in the esbuild dev-server
  (GHSA-67mh-4wv8-2f99) — dev-only, no production impact. The fix requires a
  Vite v8 major upgrade, tracked for a deliberate, coordinated bump.

---

## [1.6.3] — 2026-05-29

### Added
- **Granular error boundaries on the manager dashboard** — each tab
  (Management, Sessions, Audit Log) is now wrapped in its own `ErrorBoundary`
  with an in-place retry fallback. A crash in one tab (bad data row, render
  bug) no longer blanks the whole dashboard; the header, store selector and
  other tabs stay interactive. Boundaries auto-reset when the active tab or
  store changes.
- **Tests for security-critical paths** — `verifyStaffPin()` (Edge Function →
  RPC dual-path fallback, malformed-payload rejection, both-paths-down → null)
  and `useLockoutCountdown()` (decrement, clear, restart, unmount cleanup) now
  covered. New `ErrorBoundary` fallback/reset behaviour tested. +20 cases.
- **Dependabot** — weekly grouped npm + GitHub Actions update PRs, with
  immediate security updates; major React bumps left to manual coordination.

### Changed
- `ErrorBoundary` accepts an optional `fallback` render-prop and `resetKeys`
  for in-place, recoverable boundaries — the full-screen kiosk fallback is
  unchanged when neither is passed.

### Documentation
- README links the CHANGELOG; CONTRIBUTING drops stale hard-coded test counts.

---

## [1.6.2] — 2026-05-29

### Added
- **Sentry sourcemap upload** — `@sentry/vite-plugin` wired into
  `vite.config.ts` so production stack traces resolve to original source
  files instead of minified bundles. Upload only runs when `SENTRY_ORG`,
  `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` are all set in the build env;
  sourcemaps are deleted from `dist/` after upload so they never reach
  production. Local builds emit no `.map` files at all when those vars are
  unset, eliminating any leak risk.

### Documentation
- `.env.example` now documents the three build-time Sentry vars alongside
  the existing runtime `VITE_SENTRY_DSN`.

---

## [1.6.1] — 2026-05-28

### Security
- **Close anon RLS hole on `quiz_cards`** — the `"anon manage quiz_cards"`
  policy from migration `20260514000001` was never dropped (later hardening
  migrations targeted the wrong name); any unauthenticated visitor could
  rewrite the quiz via PostgREST. Migration
  `20260528000001_close_anon_rls_holes` drops it.
- **Drop unrate-limited `verify_staff_pin(text)` overload** — the 1-arg
  version was still granted to anon with no rate limiting, allowing
  brute-force against bcrypt. Removed; only the 4-arg form (with IP / UA
  lockout) remains.
- **Column-level GRANT for `quiz_sessions` redemption UPDATE** — the
  RLS policy from `20260501000001` was row-level, so consulenti could
  rewrite any column. Authenticated UPDATE now restricted to
  `(code_redeemed, code_redeemed_at)` columns only.
- **Fail-closed CORS** in `verify-pin` and `on-session-created` — when
  `ALLOWED_ORIGIN` is unset, browser cross-origin requests are rejected
  instead of being reflected.

### Changed
- **CSP**: allow Sentry endpoints (`*.sentry.io`, `*.ingest.sentry.io`)
  in `connect-src` so error tracking actually works in production.
  Removed `https://api.brevo.com` — Brevo is only called server-side.
- **PWA runtime cache**: scope Supabase NetworkFirst cache to
  `/rest/v1/` GETs only, avoiding stale auth tokens (`/auth/v1/*`) and
  non-idempotent RPC writes.
- **`SECURITY.md`** routes vulnerability reports to the maintainer's
  personal address (`costanzobruno.annichini@webidoo.com`).

### Added
- `EMAIL_SENDER` Edge Function secret — the Brevo sender address is now
  configurable instead of hardcoded.
- `engines.node` pin (`>=20`) in `package.json` so Vercel and contributor
  Node versions stay aligned.

### Documentation
- `README.md` + `CONTRIBUTING.md` reference the correct env var name
  (`VITE_SUPABASE_PUBLISHABLE_KEY`); previously instructed contributors
  to set `VITE_SUPABASE_ANON_KEY` which the code never reads.

### Internal
- Manager dashboard split into focused hooks/components
  (`useProductCatalog`, `useDashboardData`, `useManagerKeybindings`).
- Stats dashboard split into focused units.
- GDPR consent timestamp persisted with 5-language privacy notice.
- Various accessibility polish on PIN keypad and language picker.

---

## [1.6.0] — 2026-05-21

### Added
- **Consultant training zone (`/consulente`)** — a read-only product knowledge
  base for sales consultants. New `consulente` store role (login limited to
  `/consulente`). Per-product guides — description, two selling insights and the
  manager's advice — authored by hand in `/manager → Gestione → Guide`. No AI,
  no external API. Each guide also mirrors the customer-facing catalog
  description. IT primary / EN optional with Italian fallback. Migration
  `20260519000001_consultant_guides` (tables `product_guides` and, on standby,
  `product_guide_files`).
- Cross-navigation: `/consulente` link from the kiosk store-selection overlay
  and the `/manager` header; "Back to quiz" on the `/consulente` auth screens.
- `purge_audit_log_older_than` RPC + retention policy (migration
  `20260518000004_audit_log_retention`).

### Changed
- `useKioskMode` detects standalone display-mode (installed PWA). When the app
  runs from the Home Screen the Fullscreen API is skipped — this removes the
  iOS failure mode where focusing an input and opening the soft keyboard
  force-exits fullscreen. `AdminPinOverlay` now tells staff to install the PWA.
- `src/integrations/supabase/types.ts` extended with `product_guides` /
  `product_guide_files`.

### Fixed
- `/stats` dashboard could hang on the loading spinner if a funnel-count query
  rejected — the `Promise.all` is now guarded.
- `/consulente` no longer shows "no access" on a transient network failure —
  a connection error is separated from a genuine permissions denial.
- CSV export and date formatting in `/stats` switched from Italian to English.
- Guide editor: orphan guides (product later removed) are now reachable and
  deletable; product names render live from the catalog instead of a snapshot.

## [1.5.1] — 2026-05-18

### Security
- **C1** — `src/integrations/supabase/types.ts` was stale. Regenerated to add the `custom_products`, `product_global_status` and `language` columns on `quiz_sessions`. Corrected `verify_staff_pin` signature (was `p_pin/p_client_id/p_user_agent`, real SQL is `pin_input/client_id/user_agent/ip_address`). Added 5 missing RPC types (`mark_code_redeemed`, `purge_sessions_older_than`, `check_login_rate_limit`, `record_login_attempt`, `encrypt_session_pii`). Eliminated all `as never` casts in the codebase.
- **C2** — PII encryption in the `on-session-created` Edge Function is now `await`ed before the Brevo email send. If encryption fails the function returns 500 and the email is never sent — preserves the "encryption-at-rest before any external exposure" guarantee.
- **H3** — `COOLDOWN_BYPASS` extracted from `WelcomeScreen.tsx` to `src/config/staffEmails.ts` with a strong docstring pairing it to the server-side `WHITELIST_EMAILS` Edge Function secret.

### Fixed
- **H1** — `handleClaim` in `Index.tsx` aborts visibly when `getStoredStoreId()` returns null instead of silently saving under the hardcoded `"corso-vercelli"` fallback.
- **H2** — Edge Function `VALID_STORE_IDS` constant replaced by a kebab-case slug regex (`STORE_ID_RE`). New stores added to `src/data/stores.ts` no longer require an Edge Function redeploy.
- **H4** — `useKioskMode.activateKiosk` now `await`s `enterFullscreen()` before flipping React state. If the user denies the fullscreen prompt, the kiosk lock no longer reports itself as active.
- **H5** — `youtubeId()` regex now handles `youtube.com/shorts/`, `youtube.com/embed/` and `youtube-nocookie.com/embed/` URLs in addition to `watch?v=` and `youtu.be`.
- **H6** — `MatchResult.tsx` rAF cleanup uses a `cancelled` flag in the closure so orphan frames never call `setState` on an unmounted component.

### Polish
- **M3** — `SessionsTab` `StatusFilter` keys renamed from PT to IT to match the labels already displayed in Italian (`enviada→inviata`, `processando→in_elaborazione`, `sem_email→senza_email`, `falhou→fallita`).
- **M4** — Edge Function log no longer prints raw customer email — uses `record.id` instead. Supabase Edge logs are operational, not PII storage.
- **M5** — `applySnapshot` in `Index.tsx` simplified — the `if (!fromCache || !settingsLoaded)` guard relied on a stale closure value and was always true; replaced with unconditional `setSettingsLoaded(true)` (React batches the update). Dropped the unused `fromCache` parameter.
- Removed three unused `eslint-disable-next-line react-hooks/exhaustive-deps` directives.

### Removed (~2400 LOC + 37 deps)
- **Tier 1 — 6 orphan files**: `SplashScreen.tsx` (140 LOC, never imported), `lib/emailTemplate.ts` (469 LOC, client copy of the Edge Function template — only its test referenced it), `App.css` (Vite/Lovable boilerplate), `hooks/use-mobile.tsx`, `ui/use-toast.ts`, `assets/webidoo-envelope.png` (226 KB).
- **Tier 2 — 35 unused shadcn/ui components** (~1500 LOC): accordion, alert, alert-dialog, aspect-ratio, avatar, button, card, carousel, chart, checkbox, collapsible, context-menu, dialog, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, skeleton, slider, switch, tabs, toggle, toggle-group. Kept: tooltip, toast, toaster, sonner.
- **Tier 3 — 37 unused production npm dependencies**: `@hookform/resolvers`, `react-hook-form`, 25 `@radix-ui/*` packages, `@fontsource/space-grotesk`, `cmdk`, `date-fns`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `recharts`, `vaul`, `zod`.
- **Tier 4 — Duplicated helpers**: `getClientId()` was inlined in 3 components → `src/lib/clientId.ts`. `haptic()` was inlined in 2 components → `src/lib/haptic.ts`.

### Performance
- `webidoo-logo.png` (244 KB, 900×900 RGBA) → `webidoo-logo.webp` (17 KB, 360×360) — **93% size reduction**. PWA precache footprint dropped from 2641 KB to 2401 KB.
- CSS bundle: 67.94 KB → 49.46 KB (**-27%**) — fewer shadcn classes generated by Tailwind.
- New migration `20260518000001_perf_indexes.sql`:
  - Partial index `idx_quiz_sessions_email_sent_recent (email, created_at DESC) WHERE email_sent = true` — satisfies the Edge Function 1-email-per-hour rate-limit query from the index alone.
  - Partial index `idx_quiz_sessions_no_code (created_at DESC) WHERE discount_code IS NULL` — speeds up the `/manager` "failed" status counter.

### Testing / CI
- New `src/lib/validators.ts` extracts `STORE_ID_RE`, `isValidStoreId`, `youtubeId` for unit testing. The Edge Function copy carries a "synced copy" comment cross-referencing the test file.
- New `src/__tests__/validators.test.ts` adds 12 tests covering both the store-id shape and the 5 YouTube URL variants.
- Playwright config rewritten standalone (was importing the non-existent `lovable-agent-playwright-config` package and would have failed any e2e run). iPad Pro 11" landscape device profile.
- `package.json` scripts: added `test:e2e` and `test:e2e:install`.
- `.github/workflows/ci.yml`: new `e2e` job runs Playwright against the built app. Marked `continue-on-error` until the suite proves stable for ~2 weeks; promote to required after.
- 75 unit tests passing (was 78 before, lost 15 with the deleted `buildEmailHtml.test.ts`, gained 12 with the new `validators.test.ts`).
- `npm audit fix` brought prod+dev vulnerabilities from 11 → 5 (3 low + 2 moderate, all in dev tooling). Remaining 5 require breaking changes (Vite major upgrade); deferred.

### Added — Multi-store role management UI
- New `RolesTab` (`src/components/manager/RolesTab.tsx`) under `/manager → Gestione → Ruoli`. Lets a manager list every `store_roles` entry (joined to `auth.users.email`), upsert a role for any email, and remove an entry — all without leaving the dashboard.
- New migration `20260518000002_store_roles_admin_rpc.sql` exposes three `SECURITY DEFINER` RPCs:
  - `list_store_roles_admin()` — returns all rows, manager-only.
  - `upsert_store_role_admin(p_user_email, p_role, p_store_id)` — UPSERT keyed on `auth.users.email`. Validates the role enum and requires a `store_id` for `consulente_responsabile`.
  - `delete_store_role_admin(p_role_id)` — refuses self-deletion (caller can't lock themselves out).
- Each RPC checks the caller's own `store_roles.role === 'manager'` before doing anything; non-managers receive a clear forbidden error surfaced in the UI.
- `types.ts` updated to include the 3 new RPCs.

### Pending (next minor)
- **Translation API**: `QuizCardsTab` "🌐 Traduci" button is still disabled but now carries an inline TODO with the implementation plan (DeepL / Google Translate API key + new `translate-card` Edge Function).
- **Capacitor iOS/Android**: scripts ready (`cap:ios`, `cap:android`) but `ios/` and `android/` directories not yet generated (needs Xcode / Android Studio).
- **Lighthouse CI**: README claims a PWA badge but no CI workflow yet runs Lighthouse on PRs.

---

## [1.5.0] — 2026-05-15

### Security
- **S1** — `mark_code_redeemed` RPC restricted to `authenticated` role only (was `anon`). Added store-level validation: `consulente_responsabile` can only redeem sessions for their assigned store (migration `20260515000001`)
- **S2** — Search input in `SessionsTab` now escapes `%`, `_` and `\` before interpolation into PostgREST `.or()` — eliminates injection vector
- **S3** — Removed `?? "*"` CORS fallback from both Edge Functions (`on-session-created`, `verify-pin`). Unset `ALLOWED_ORIGIN` now silently rejects cross-origin instead of allowing all

### Added — Internationalisation
- **I2** — Quiz language propagates through to the transactional email. Edge Function builds the email in the customer's chosen language (IT / EN / PT / ES / FR) — preheader, section headers, redemption steps, action items, footer
- **I3** — `welcome.offlineBanner` translation key added in all 5 languages; replaces hardcoded Italian string
- **I1** — Status labels in `SessionsTab` corrected from Portuguese to Italian: `ENVIADA → INVIATA`, `PROCESSANDO → IN ELABORAZIONE`, `SEM EMAIL → SENZA EMAIL`, `FALHOU → FALLITA`. KPI labels also corrected

### Added — iPad / Kiosk
- `interactive-widget=resizes-content` viewport directive prevents the URL bar from appearing when the keyboard rises in fullscreen kiosk mode
- `useViewportKeyboard` hook tracks the virtual keyboard via the `visualViewport` API and exposes `--keyboard-height` as a CSS variable
- Inputs scroll into view on focus (`scrollIntoView`, 300 ms delay to wait for keyboard animation)
- iOS splash screen meta tags for iPad Pro 12.9", iPad Pro 11", iPad 10th gen, iPad mini 6th gen

### Added — Accessibility (WCAG 2.1 AA)
- **U1** — All manager dashboard buttons raised to `min-h-[44px]` to meet Apple HIG tap-target minimum
- **U2** — Global `:focus-visible` ring rule + `focus-visible:ring-2 focus-visible:ring-primary` on every interactive element
- **U3** — `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, and `Escape`-to-close on `StoreSelectorModal`, `FaqModal` and the purge confirmation modal
- **U4** — `text-muted-foreground` on `bg-muted/20` replaced with `text-foreground/70` for contrast
- `@media (prefers-reduced-motion: reduce)` global CSS rule + Framer Motion `MotionConfig reducedMotion="user"` in `App.tsx`

### Added — Polish & Quality
- `ProductSkeleton` component replaces the "Caricamento…" text in `ProductCatalogTab`
- `stripHtml()` sanitises custom product `name` and `description` fields before save
- `src/lib/imageProcessing.ts` extracts the duplicated `resizeImage` from `ManagerDashboard` and `ProductCatalogTab`
- `SessionsTab` stagger animation reduced (delay 0.03 → 0.02 max, capped at 0.15s, duration 0.2s) to remove jank on iPad with 20+ items
- `SECURITY.md`, `CONTRIBUTING.md`, comprehensive `CHANGELOG.md` and architecture-diagrammed `README.md` added

---

## [1.4.0] — 2026-05-14

### Added
- Drag-and-drop quiz card reordering via `@dnd-kit/sortable`
- Skeleton loaders in `SessionsTab` and `QuizCardsTab`
- Server-side search debouncing (300 ms) via `useDebounce` hook
- Slug collision check for new custom products against both core and DB catalogs
- Configurable discount-code TTL (6h / 12h / 24h / 48h / 72h), persisted in `localStorage`
- Supabase Realtime subscription in `SessionsTab` — sessions and KPIs update live
- Startup `checkCacheIntegrity()` purges `wm_cache_*` entries when version changes
- Auto-resize of uploaded product images to ≤ 1024 px JPEG at q=80
- Playwright E2E test suite (`e2e/quiz-flow.spec.ts`) — kiosk flow, manager auth, 404, console errors
- Toast notifications via `sonner` for all manager actions
- Keyboard shortcuts: `Ctrl+S` refresh, `Esc` close modals
- Bulk activation/deactivation for quiz cards
- Advanced session filters: date range, product, match % range
- Sentry error tracking + browser tracing + session replay

---

## [1.3.0] — 2026-05-07

### Added
- **Sessions tab pagination** — 20 sessions per page with prev/next controls; resets on filter change
- **Resilient sessions fetch** — graceful fallback when `code_redeemed*` columns are absent (migration not yet applied); real error message surfaced to UI
- **CI pipeline** — GitHub Actions workflow: typecheck → lint → test → build on every push and PR

### Fixed
- `tailwind.config.ts` — replaced `require()` with ESM import to clear ESLint error
- `MatchResult.tsx` — suppressed spurious `react-hooks/exhaustive-deps` warning for stable motion/sound refs
- `STAFF_PIN` CORS origin gate — `ALLOWED_ORIGIN=*` default prevents silent rejection on mismatched origin

---

## [1.2.0] — 2026-05-07

### Added
- **verify-pin Edge Function rewrite** — primary check reads `STAFF_PIN` Supabase secret directly (no DB round-trip); constant-time comparison; 5-failure / 2-min IP lockout in-memory
- **Migration `20260507000004`** — sets up the `app_config` staff-PIN storage table and RLS
- **`.env.example`** — documented `STAFF_PIN` as required secret with setup instructions

### Fixed
- Staff PIN consistently failing for `/manager` and `/stats` — root cause was an unpopulated `staff_pin_hash` in `app_config`

---

## [1.1.0] — 2026-05-07

### Added
- **Vite `manualChunks`** — main bundle split from 762 KB → 188 KB (react-vendor, framer-motion, supabase, router, react-query, radix as separate cacheable chunks)
- **Migration `20260507000001`** — fixes `verify_staff_pin` to use `extensions.crypt` search path
- **Migration `20260507000002`** — removes legacy product IDs from `quiz_sessions_store_id_check`
- **Migration `20260507000003`** — funnel events hardening (event type allowlist, funnel_key uniqueness index)

### Changed
- `QuizBackground.tsx` — orb sizes converted to `vmin` (58/44/38/30/22vmin); particle count gated by device tier (low: 0, mid: 10, high: 18)
- `SuccessScreen.tsx` — orbs converted from fixed px to `vmin` (55/48/44/39vmin)

### Fixed
- **iPad first-paint orb flash** — `borderRadius`, `backgroundColor`, `opacity`, GPU hints moved to inline `style` so first paint is already round and blurred (Framer Motion `animate` and Tailwind classes don't apply until after JS hydration)

---

## [1.0.0] — 2026-05-01

### Added
- **Code redemption** — manager can mark discount codes as used; columns `code_redeemed` / `code_redeemed_at` added to `quiz_sessions`
- **Store roles RLS** — `manager_read_sessions` and `consulente_read_sessions` policies; `get_my_store_role()` RPC
- **PII encryption at rest** — `nome_enc` / `cognome_enc` via `pgp_sym_encrypt`; `email_hash` for deduplication (migration `20260429000003`)
- **Audit log store_id** — manager actions scoped to store (migration `20260429000004`)
- **Silent security hardening** — IP address tracking in `admin_access_log`; `check_email_cooldown` rate-limiting; `quiz_sessions_store_id_check` constraint (migration `20260429000001`)

---

## [0.9.0] — 2026-04-18

### Added
- **Email cooldown** — server-side 1-hour per-email cooldown enforced via RPC (migration `20260418000001`)
- **FAQ columns** — `faq_q` / `faq_a` per product-store pair (migration `20260418000002`)

---

## [0.8.0] — 2026-04-16

### Added
- **Discount codes** — per-session unique discount code generation; `discount_code` column; `product_snapshot` for auditability (migration `20260416000007`)

---

## [0.7.0] — 2026-04-11

### Added
- **Price overrides** — `price_override` column in `product_settings`; per-store price management in dashboard (migration `20260411000006`)

---

## [0.6.0] — 2026-04-07

### Added
- **Funnel events** — `quiz_funnel_events` table tracking `started`, `result_shown`, `claimed` (migration `20260407000003`)
- **Login rate limiting** — DB-level failed-login tracking (migration `20260407000004`)
- **PIN user-agent logging** — extended `admin_access_log` (migration `20260407000005`)
- **Google Sheets relay** — `relay-to-sheets` Edge Function for real-time CRM sync

---

## [0.5.0] — 2026-04-06

### Added
- **Multi-store support** — `store_id` column in `quiz_sessions`; store selector in manager dashboard (migration `20260406000001`)

---

## [0.4.0] — 2026-04-05

### Added
- **Manager audit log** — records every product toggle with user, store, timestamp (migration `20260405000005`)
- **Product settings** — per-store activation, image/video URL, discount config (migration `20260405000004`)
- **Final security hardening** — CSP, HSTS, SameSite cookies (migration `20260405000006`)

---

## [0.3.0] — 2026-04-04

### Added
- **nome / cognome capture** — first and last name fields in welcome screen (migration `20260404000002`)
- **Constraint hardening** — email format, match_percent range checks (migration `20260404000003`)
- **Security hardening** — RLS policies, service-role restrictions (migration `20260404000001`)

---

## [0.1.0] — 2026-04-01

### Added
- Initial schema: `quiz_sessions`, base RLS, `verify_staff_pin` RPC, `admin_access_log` (migration `20260401212432`)
- Attract screen → Language selection → Welcome → Quiz (8 swipes) → Match Result → Success flow
- Brevo email delivery via `on-session-created` Edge Function
- 5 languages (IT, EN, PT, ES, FR)
- Manager dashboard with PIN gate
- Analytics dashboard with MFA gate
- PWA manifest, service worker, wake lock
- Web Audio API ambient soundtrack
