# Changelog

All notable changes to Webi-Match are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [SemVer](https://semver.org/spec/v2.0.0.html).

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
- **Migration `20260507000004`** — idempotently seeds staff PIN hash to "0123" and clears lockouts
- **`.env.example`** — documented `STAFF_PIN` as required secret with setup instructions

### Fixed
- PIN "0123" consistently failing for `/manager` and `/stats` — root cause was unpopulated `staff_pin_hash` in `app_config`

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
