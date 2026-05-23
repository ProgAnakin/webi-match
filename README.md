<div align="center">

# 🎯 Webi-Match

**An iPad-first product discovery kiosk for physical retail**

[![CI](https://github.com/ProgAnakin/webi-match/actions/workflows/ci.yml/badge.svg)](https://github.com/ProgAnakin/webi-match/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-75%20unit%20%2B%208%20e2e-22c55e)](./src/__tests__)
[![Languages](https://img.shields.io/badge/i18n-5%20languages-f5831c)](./src/i18n/translations.ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Edge%20Functions-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](./LICENSE)

*Customers swipe through 8 personalised questions — Tinder-style — and receive an instant product recommendation with a tailored discount and a personalised video from a consultant.*

### 🌐 [**Live Demo → webi-match.vercel.app**](https://webi-match.vercel.app)

*Best experienced on iPad (1024×1366) in landscape · Works on any modern browser*

</div>

---

## Overview

**Webi-Match** turns idle in-store iPads into a conversion-driving touchpoint. A customer answers eight quick swipe questions, a matching algorithm recommends one product, generates a unique discount code, and delivers a personalised follow-up email in the customer's language. The whole experience runs in under two minutes.

**Built for:** physical retail with a curated catalog — tech, beauty, gifts, sporting goods, fragrance — where customers know roughly what they want but get overwhelmed by choice.

**Status:** in production across multiple Webidoo Store locations on iPad.

### What it delivers

- 📥 **First-party lead capture** with explicit GDPR consent at the point of collection
- 🎯 **Product matchmaking** — eight questions to one recommendation, reduces choice paralysis
- 🎟️ **Personalised discount codes** generated server-side and emailed in the customer's chosen language (IT / EN / PT / ES / FR)
- 🏪 **Multi-store, per-store catalogs** managed from a single dashboard, with one-click "send products to another store" between locations
- 📊 **Real-time analytics** — conversion funnel, per-store breakdowns, code-redemption tracking
- 🎓 **Consultant training module** — manager-authored sales guides per product, used to onboard new sales staff

---

## 📸 Demo

> Live deployment running daily across multiple Webidoo Store locations on iPad.

<table align="center">
  <tr>
    <td align="center"><b>Attract loop</b></td>
    <td align="center"><b>Welcome</b></td>
    <td align="center"><b>Quiz</b></td>
    <td align="center"><b>Match Result</b></td>
    <td align="center"><b>Manager Dashboard</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/attract.png" width="175"/></td>
    <td><img src="docs/screenshots/welcome.png" width="175"/></td>
    <td><img src="docs/screenshots/quiz.png" width="175"/></td>
    <td><img src="docs/screenshots/result.png" width="175"/></td>
    <td><img src="docs/screenshots/manager.png" width="175"/></td>
  </tr>
</table>

---

## 🏗️ Architecture

```mermaid
flowchart LR
  subgraph iPad["📱 iPad Kiosk — PWA"]
    A[Attract Screen] --> W[Welcome + Lang]
    W --> Q[Quiz · 8 Swipes]
    Q --> M[Match Result]
    M --> S[Success Screen]
  end

  subgraph Manager["🖥️ Manager Dashboard"]
    D[/manager · PIN-auth/]
    D --> Sessions[Sessions Tab]
    D --> Catalog[Catalog Tab]
    D --> Cards[Quiz Cards Tab]
    D --> Email[Email Template Tab]
  end

  subgraph Stats["📊 Stats Dashboard"]
    ST[/stats · MFA/]
  end

  subgraph Supabase["☁️ Supabase"]
    DB[(PostgreSQL<br/>RLS · Encrypted PII)]
    EF1[Edge Function<br/>on-session-created]
    EF2[Edge Function<br/>verify-pin]
    EF3[Edge Function<br/>relay-to-sheets]
    Storage[(Object Storage<br/>Product Images)]
  end

  subgraph External["🌐 External Services"]
    Brevo[Brevo<br/>Transactional Email]
    Sheets[Google Sheets<br/>CRM Relay]
    Sentry[Sentry<br/>Error Tracking]
  end

  S -->|INSERT quiz_session| DB
  DB -->|webhook trigger| EF1
  EF1 -->|HTML email 5 lang| Brevo
  EF1 -->|server-side relay| Sheets
  Q -.->|funnel events| DB
  D -->|read/write| DB
  D -->|PIN check| EF2
  ST -->|read aggregates| DB
  Catalog -->|upload| Storage

  iPad -.->|errors + replays| Sentry
  Manager -.->|errors| Sentry

  classDef ipad fill:#f5831c20,stroke:#f5831c,color:#fff
  classDef supa fill:#3ECF8E20,stroke:#3ECF8E,color:#fff
  classDef ext fill:#4D96FF20,stroke:#4D96FF,color:#fff
  class A,W,Q,M,S ipad
  class DB,EF1,EF2,EF3,Storage supa
  class Brevo,Sheets,Sentry ext
```

**Data flow at a glance:**

1. Customer completes quiz → `quiz_sessions` row inserted
2. Database webhook fires `on-session-created` Edge Function
3. Edge Function generates a unique discount code, encrypts PII at rest, builds a multilingual HTML email and dispatches it via Brevo
4. The same Edge Function relays the lead to Google Sheets (CRM)
5. Manager dashboard observes everything in real-time via Supabase Realtime subscriptions

---

## ✨ Features

### Customer-facing (kiosk)
- 🃏 **Tinder-style swipe quiz** — 8 questions, gesture-driven, haptic feedback
- 🌍 **5 languages** — Italian, English, Portuguese, Spanish, French
- 🧠 **Deterministic matching algorithm** — weighted scoring across 8 product categories with random tie-break
- 🎁 **Personalised discount codes** — unique per session, configurable TTL (6h / 12h / 24h / 48h / 72h)
- 📧 **Multilingual automated emails** — product info, consultant video, discount, FAQ — all translated to the language the customer picked
- 🎵 **Synthesised ambient soundtrack** — Web Audio API generative music, zero audio assets
- 💤 **Inactivity reset** — auto-returns to attract loop after 45s of idle (90s on result screen)
- 🔒 **Wake lock** — prevents iPad screen from sleeping
- 📵 **Offline-capable PWA** — service worker, runtime cache, graceful degradation

### Manager dashboard (`/manager`)
- 📊 **Real-time sessions** — live updates via Supabase Realtime, KPI cards, advanced filters (date, product, match %), CSV export, retention purge
- 🛍️ **Product catalogue** — slug-collision-safe custom products, per-store overrides (price, image, video, discount %), drag-and-drop quiz cards
- ✉️ **Email template editor** — live preview, configurable code TTL
- 🏪 **Multi-store support** — per-store activation, role-based access (`manager` sees all, `consulente_responsabile` sees own store)
- ⌨️ **Keyboard shortcuts** — `Ctrl+S` refresh, `Esc` close modals

### Stats dashboard (`/stats`)
- 📈 **Funnel analysis** — `quiz_started → result_shown → claimed` conversion
- 📦 **Product performance** — match distribution, redemption rate, lead volume
- 🏬 **Per-store breakdowns** — comparative store analytics

### Consultant training zone (`/consulente`)
- 🎓 **Read-only product knowledge base** for sales consultants
- 📝 **Per-product guides** — description, two selling insights and the manager's advice, authored by hand in `/manager` (no AI, no external API)
- 👁️ **Customer-facing description mirror** — shows the exact text the customer reads on their match result
- 🌍 **IT / EN toggle** with Italian fallback

---

## 🎯 Use Cases

Webi-Match was designed and validated in tech retail, but the model transfers cleanly to any curated-catalog category.

| Use case | Where it fits |
|---|---|
| **In-store lead capture** | Storefronts that want first-party, GDPR-consented email leads instead of paper sign-ups or QR-code prompts that nobody scans. |
| **Choice-paralysis catalogs** | Tech, beauty, fragrance, sporting goods, wine, gifts — categories with 20–100 products where the customer needs guidance to one. |
| **Gift-finding (seasonal)** | Christmas, birthdays, anniversaries, Valentine's. Customer answers about the recipient, gets a match — converts indecision into a sale. |
| **Multi-store chains** | Each location curates its own active catalog with per-store pricing, imagery and discounts; one dashboard manages all of them; "send to store" copies a setup between locations. |
| **Pop-ups, events, brand activations** | Installable PWA — boots on any iPad, no per-event setup. Useful for product launches, fairs, in-store campaigns. |
| **Sales-staff training** | The `/consulente` module gives each product a sales guide (description, two insights, manager's advice, video link) — used to onboard new floor staff. |
| **First-party marketing database** | Every consented capture feeds a GDPR-clean opt-in list, segmented by lifestyle/interest tags from the quiz answers. |
| **Merchandising analytics** | Funnel + product-performance dashboards reveal which products customers gravitate to — informs assortment, procurement and per-store stocking. |

---

## 🛡️ Security & Quality Highlights

| Category | Implementation |
|---|---|
| **Authentication** | Supabase Auth · PIN + bcrypt fallback · in-memory IP-based lockout · MFA for stats |
| **Authorisation** | Row-Level Security on every table · role-based access (`manager` / `consulente_responsabile` / `consulente`) · per-store data isolation |
| **PII Protection** | AES encryption at rest for `nome`/`cognome` · SHA-256 email hashing for lookups · keys stored as Edge Function secrets |
| **Rate Limiting** | Server-side enforced 1-email-per-hour per address · cannot be bypassed from client |
| **Injection Defence** | All search inputs escape `%` `_` `\` before PostgREST `.or()` interpolation · `escHtml()` in every email template field |
| **CORS** | Strict origin allowlist · no wildcard fallback · silent rejection of unexpected origins |
| **Webhooks** | DB webhooks gated by valid `store_id` allowlist · unknown stores silently dropped |
| **Accessibility** | Kiosk-targeted tap targets (≥ 64 px on the PIN keypad and quiz buttons) · `focus-visible:ring-2` rings on interactive elements · `prefers-reduced-motion` respected via Framer Motion `MotionConfig` · informational copy bumped above the `/65` opacity threshold for in-store lighting |
| **Internationalisation** | 5 fully translated languages, including the transactional emails sent to customers |
| **Testing** | 75 unit tests (Vitest) · 8 E2E tests (Playwright) · typecheck + lint + build on every push via GitHub Actions |
| **Observability** | Sentry error tracking + session replay · structured logging in Edge Functions |
| **Performance** | Manual chunk splitting · lazy-loaded admin routes · image auto-resize ≤ 1024px JPEG q=80 · PWA precaching · debounced search |
| **iPad / Kiosk** | `interactive-widget=resizes-content` prevents URL bar on keyboard · `visualViewport` API for keyboard-aware layouts · iOS splash screens · wake lock · `100dvh` everywhere |

---

## ⚡ Performance

| Concern | Approach | Notes |
|---|---|---|
| **Bundle (main chunk)** | ~60 KB gzip | Manual `manualChunks` splits react-vendor, framer-motion, supabase and radix into separate cacheable chunks; admin routes lazy-loaded |
| **LCP** | Attract screen paints from CSS only | No image in the critical path |
| **PWA** | Full manifest + service worker + runtime cache | Installable on iPad standalone |
| **Image pipeline** | Auto-resize ≤ 1024 px JPEG q=80 | Runs in the manager catalog before Supabase Storage upload |
| **Search debounce** | 300 ms | Prevents a DB hit on every keystroke |
| **Animation budget** | ≤ 0.15 s stagger | Capped to prevent jank on 20+ row session lists on iPad |

> Run `npx lighthouse https://webi-match.vercel.app --view` to benchmark on your own network.

---

## 🗂️ Architecture Decision Records

Key architectural trade-offs are documented in [`docs/adr/`](./docs/adr/):

| ADR | Decision |
|-----|---------|
| [001](./docs/adr/001-supabase-over-firebase.md) | Supabase (PostgreSQL + RLS + pgcrypto) over Firebase |
| [002](./docs/adr/002-pwa-over-native.md) | PWA over native iOS app (with Capacitor escape hatch) |
| [003](./docs/adr/003-pii-encryption-at-rest.md) | PII encryption at the database layer (pgp_sym_encrypt + SHA-256) |
| [004](./docs/adr/004-swipe-quiz-over-form.md) | Tinder-style swipe quiz over a traditional form |
| [005](./docs/adr/005-synchronous-pii-encryption.md) | Synchronous PII encryption before email dispatch |

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite + SWC |
| **Animations** | Framer Motion (with `reducedMotion="user"`) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State** | React Query · Context |
| **Backend** | Supabase (PostgreSQL + Edge Functions + RLS + Storage + Realtime) |
| **Email** | Brevo (transactional API) |
| **CRM** | Google Sheets (server-side relay) |
| **Audio** | Web Audio API (synthesised generative loop) |
| **Errors** | Sentry (browser tracing + replays) |
| **PWA** | vite-plugin-pwa + Workbox |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Tests** | Vitest + Testing Library + Playwright |
| **CI** | GitHub Actions (typecheck · lint · test · build) |
| **Deploy** | Vercel (auto-deploy on push to `main`) |
| **Native** | Capacitor (iOS + Android builds supported) |

---

## 📁 Project Structure

```
src/
├── assets/              # Static brand assets (logo, envelope image)
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── manager/         # Manager dashboard (sessions, catalog, quiz cards, email)
│   ├── stats/           # Analytics dashboard components
│   ├── AttractScreen    # Idle attract loop
│   ├── WelcomeScreen    # Language selection + data capture
│   ├── QuizScreen       # 8-question swipe quiz orchestrator
│   ├── SwipeCard        # Individual Tinder-style card
│   ├── MatchResult      # Product recommendation display
│   ├── SuccessScreen    # Post-claim confirmation
│   └── ErrorBoundary    # App-level crash recovery screen
├── data/
│   ├── products.ts      # Product catalog + matching algorithm
│   ├── quiz-cards.ts    # Dynamic quiz question schema
│   └── stores.ts        # Store configuration
├── hooks/               # useDebounce, useWakeLock, useInactivityReset, useBgMusic, useViewportKeyboard…
├── i18n/                # Full translations in 5 languages
├── integrations/        # Supabase client + generated types
├── lib/                 # imageProcessing, startupCache, validators, haptic, clientId, utils
└── pages/               # Route-level page components

supabase/
├── functions/
│   ├── on-session-created/   # Email dispatch · PII encryption · CRM relay · multilingual templates
│   ├── verify-pin/           # Staff PIN auth with IP-based lockout
│   └── relay-to-sheets/      # Google Sheets relay (JWT-authenticated)
└── migrations/               # Versioned SQL migrations (RLS, encryption, rate limits, RPC functions)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase project (URL + anon key)

### Local Setup

```bash
git clone https://github.com/ProgAnakin/webi-match.git
cd webi-match
npm install
cp .env.example .env
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SENTRY_DSN=https://your-sentry-dsn (optional)
```

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | ESLint check |
| `npm run cap:ios` | Build + open iOS Capacitor project |
| `npm run cap:android` | Build + open Android Capacitor project |

---

## 📦 Deployment

Auto-deploys on every push to the production branch via Vercel. Security headers, CSP, HSTS and SPA routing are declared in `vercel.json`.

The CI workflow runs typecheck, lint, test and build on every push to `main`, every PR, and every `claude/*` / `feat/*` / `fix/*` branch.

---

## 🗄️ Database

| Table | Purpose |
|-------|---------|
| `quiz_sessions` | One row per completed quiz — email, answers, matched product, store, discount code, language |
| `quiz_funnel_events` | Conversion funnel tracking (`quiz_started` / `result_shown` / `claimed`) |
| `product_settings` | Per-store product activation, pricing, images, videos, discounts, FAQ |
| `custom_products` | Per-store custom products (with collision-safe slug IDs) |
| `quiz_cards` | Dynamic quiz question schema with drag-and-drop ordering |
| `email_template` | Editable email template (subject, header title, subtitle, footer) |
| `product_guides` | Per-product consultant training guides shown in `/consulente` |
| `product_guide_files` | Downloadable manuals/spec sheets per product (schema ready, UI on standby) |
| `store_roles` | Role-based access mapping (`manager` / `consulente_responsabile` / `consulente`) |
| `manager_audit_log` | Dashboard action audit trail |
| `admin_access_log` | PIN access tracking with IP + user-agent |
| `app_settings` | Encrypted application secrets (PIN hash) |

Every table is protected by Row-Level Security. Rate limiting is enforced at the database-function level. PII columns are AES-encrypted at rest.

---

## 🛣️ Admin Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/manager` | PIN-protected | Product, quiz card, store, email-template and consultant-guide configuration · session & code tracking |
| `/stats` | MFA-protected | Session data, funnel metrics, per-store performance |
| `/consulente` | Login + role | Read-only product training zone for sales consultants |
| `/reset-password` | Public | Password reset flow |

---

## 🖼️ Product Images

Place core product images in `public/products/` and reference them in `src/data/products.ts`. Recommended format: PNG, 600×600px, transparent background. Per-store images can be overridden via the Manager Dashboard (uploaded to Supabase Storage and auto-resized to 1024px JPEG, q=80).

---

## 👤 Author & License

**Costanzo Annichini** — Tech Sales & Customer Success @ Webidoo Store

Webi-Match was conceived, designed and built end-to-end as an independent initiative — **outside of formal job duties, on personal time, with no brief from the company**. Architected and shipped solo, from the swipe interaction and matching algorithm to the Supabase backend, security model, multilingual email automation, and the manager + consultant dashboards.

- **GitHub:** [github.com/ProgAnakin](https://github.com/ProgAnakin)
- **LinkedIn:** [linkedin.com/in/costanzoannichini](https://www.linkedin.com/in/costanzoannichini/)

Architectural decisions: [`docs/adr/`](./docs/adr/) · Operational triage: [`docs/runbook.md`](./docs/runbook.md)

### License

Proprietary — © Costanzo Annichini. All rights reserved. Not affiliated with, sponsored by, or representative of any official Webidoo product.
