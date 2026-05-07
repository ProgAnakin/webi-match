# Webi-Match

[![CI](https://github.com/ProgAnakin/webi-match/actions/workflows/ci.yml/badge.svg)](https://github.com/ProgAnakin/webi-match/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://webi-match.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Edge%20Functions-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](./LICENSE)

**Interactive product discovery kiosk for Webidoo retail stores — built for iPad, running in production.**

Customers swipe through 8 personalised questions — Tinder-style — and receive an instant product recommendation with a dedicated discount and a personalised video from a consultant. Email is captured for CRM and newsletter integration.

---

## Overview

Webi-Match is a touchscreen kiosk experience designed for iPad deployment in Webidoo electronics retail stores. The app guides customers through a short preference quiz and produces a tailored gadget recommendation, driving both in-store conversion and post-visit engagement via automated email follow-up.

**Flow:**
`Attract Screen → Language Selection → Welcome + Data Capture → Quiz (8 swipes) → Match Result → Success + Email Delivery`

---

## Features

- **Tinder-style swipe interface** — gesture-based quiz with haptic feedback
- **Smart matching algorithm** — deterministic weighted scoring across 8 product categories
- **5 languages** — Italian, English, Portuguese, Spanish, French
- **Automated email delivery** — personalised email with product info, consultant video, and discount code via Brevo
- **CRM integration** — real-time data relay to Google Sheets (server-side only)
- **Multi-store support** — per-store product activation, pricing, and discount configuration
- **Manager dashboard** — product settings, pricing overrides, image/video URLs, store management
- **Sessions dashboard** — per-session email status (enviada / processando / falhou) and discount code tracking
- **Analytics dashboard** — session funnels, match distribution, lead volume, per-store stats
- **Anti-spam cooldown** — 1-hour email-level cooldown to prevent duplicate leads
- **Inactivity reset** — auto-resets to attract screen after 45 seconds of inactivity (90 seconds on result screen)
- **Synthesised ambient soundtrack** — Web Audio API generative music during the quiz
- **PWA-ready** — offline capable, installable, service worker caching
- **Wake lock** — prevents iPad screen from sleeping during deployment

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite + SWC |
| Animations | Framer Motion |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL + Edge Functions + RLS) |
| Email | Brevo API |
| CRM | Google Sheets (server-side relay via Edge Function) |
| Audio | Web Audio API (synthesised ambient loop) |
| Deploy | Vercel (auto-deploy on push to `main`) |
| Native | Capacitor (iOS + Android builds supported) |

---

## Project Structure

```
src/
├── assets/              # Static brand assets (logo, envelope image)
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── manager/         # Manager dashboard components
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
│   ├── questions.ts     # Quiz question definitions
│   └── stores.ts        # Store configuration
├── hooks/               # Custom React hooks (music, wake lock, inactivity, sound)
├── i18n/                # Full translations in 5 languages
├── integrations/        # Supabase client + generated types
├── lib/                 # Email template engine, utilities
└── pages/               # Route-level page components

supabase/
├── functions/
│   ├── on-session-created/   # Triggered on quiz completion — sends email via Brevo + CRM relay
│   ├── verify-pin/           # Staff PIN verification with IP-based lockout
│   └── relay-to-sheets/      # Google Sheets CRM relay (JWT-authenticated)
└── migrations/               # Versioned SQL migrations
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project (URL + anon key)

### Local Setup

```bash
git clone <repository-url>
cd webi-match
npm install
cp .env.example .env
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Deployment

The project auto-deploys on every push to the production branch. Security headers, CSP, HSTS, and SPA routing are configured in `vercel.json`.

---

## Database

| Table | Purpose |
|-------|---------|
| `quiz_sessions` | One row per completed quiz — email, answers, matched product, store |
| `product_settings` | Per-store product activation, prices, images, videos, discounts |
| `quiz_funnel_events` | Conversion funnel tracking (started / result shown / claimed) |
| `manager_audit_log` | Dashboard action audit trail |
| `admin_access_log` | PIN access tracking with IP and user-agent logging |
| `app_settings` | Encrypted application secrets (PIN hash) |

All tables use Row-Level Security. Rate limiting is enforced at the database function level.

---

## Admin Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/manager` | PIN-protected | Product and store configuration + session/code tracking |
| `/stats` | MFA-protected | Session data, funnel metrics, product performance |

---

## Product Images

Place product images in `public/products/` and reference them in `src/data/products.ts`. Recommended format: PNG, 600×600px, transparent background. Per-store images can be overridden via the Manager Dashboard (uploaded to Supabase Storage).

---

## License

Proprietary — © Webidoo. All rights reserved.
