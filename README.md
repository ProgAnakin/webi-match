<div align="center">

# ⚡ Webi-Match

### *Swipe. Match. Buy.*

**The interactive kiosk experience that turns product discovery into a game.**

Deployed on iPad screens across all Webidoo retail locations — Webi-Match guides customers through 8 personalised questions using a Tinder-style swipe mechanic, then reveals the tech product that fits their life best. Complete with a match score, an exclusive video from a Webidoo consultant, and a special discount to close the deal.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## The Idea

Walking into a tech store is overwhelming. Hundreds of products, dozens of specs, zero guidance.

Webi-Match flips that experience. Instead of browsing shelves, customers answer eight fun yes/no questions about their life — fitness, music, travel, gaming, wellness — and the app does the matching. In under 60 seconds they have a personalised recommendation, a match percentage, and a reason to buy today.

It's not a product finder. It's a conversation starter.

---

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │     │                 │
│   👋 Welcome    │────▶│  👆 8 Swipes    │────▶│  🎯 Your Match  │────▶│  ✅ Claim Deal   │
│                 │     │                 │     │                 │     │                 │
│  Name + Email   │     │  Left = No      │     │  Match Score    │     │  Video from     │
│  Language pick  │     │  Right = Yes    │     │  Product card   │     │  consultant +   │
│                 │     │  Tap buttons    │     │  Price + stars  │     │  Special offer  │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

**4 steps. No friction. Maximum engagement.**

---

## Features

### Customer Experience
- **Tinder-style swipe interface** — drag cards left/right or tap the action buttons
- **8 lifestyle questions** across fitness, audio, productivity, camera, travel, gaming, communication, and wellness
- **AI-style matching** with a personalised percentage score (45–98%)
- **Animated result reveal** — slot-machine countdown builds suspense before the match drops
- **Confetti celebration** — particle burst on match reveal, adapts to device performance
- **5 languages** — Italian, English, Portuguese, Spanish, French (auto-detected or manually selected)
- **Inactivity reset** — kiosk auto-returns to welcome screen after idle, with a clear countdown warning

### Retail & Business
- **Multi-store architecture** — 4 Webidoo locations (Corso Vercelli, 5 Giornate, Verona, Bergamo)
- **Product catalogue management** — enable/disable individual products per store in real time
- **Email collection** — every session captures name + email for CRM and newsletter
- **Instant deal delivery** — post-match, customers receive a consultant video and exclusive discount
- **Undo safety net** — accidental product toggles can be reversed within 8 seconds

### Analytics Dashboard (`/stats`)
- **Real-time session tracking** — total sessions, unique emails, average match score, today's count
- **Abandonment funnel** — tracks Quiz Started → Result Shown → Claimed with step-to-step conversion %
- **Top matched products** — ranked bar chart of which products win most
- **7-day activity chart** — daily session volume for the past week
- **Store filter** — compare performance across locations side by side
- **Date range filter** — drill into any custom time window
- **CSV export** — download sessions with email, product, match %, store and date (GDPR-confirmed)

### Security
- **Staff PIN access** — numeric keypad overlay with server-side bcrypt verification (no client-side secrets)
- **Dual-fingerprint lockout** — PIN brute force blocked by both device ID *and* browser User-Agent; clearing localStorage doesn't reset the lockout
- **2FA (TOTP)** — optional time-based two-factor authentication for the analytics dashboard
- **Server-side rate limiting** — login attempts tracked in Supabase, not sessionStorage (not bypassable via DevTools)
- **Admin idle timeout** — automatic sign-out after 10 minutes of inactivity
- **GDPR export warning** — mandatory confirmation step before any CSV download
- **Audit log** — every product toggle is logged with user ID, email, and timestamp

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript 5, Vite 5 (SWC) |
| **UI** | Tailwind CSS, shadcn/ui (Radix UI primitives) |
| **Animations** | Framer Motion 12 |
| **Routing** | React Router 6 |
| **Backend / DB** | Supabase (PostgreSQL, RLS, RPC, MFA/TOTP) |
| **Auth** | Supabase Auth with optional TOTP 2FA |
| **Icons** | Lucide React |
| **Fonts** | Space Grotesk |
| **Deploy** | Vercel (auto-deploy on push to `main`) |
| **Testing** | Vitest + Playwright + Testing Library |

---

## Project Structure

```
src/
├── components/
│   ├── manager/
│   │   ├── ManagerDashboard.tsx   # Product catalogue UI + undo toggle
│   │   └── StoreSelectorModal.tsx # Per-device store selector
│   ├── stats/
│   │   ├── Dashboard.tsx          # Analytics dashboard
│   │   ├── LoginForm.tsx          # Rate-limited login
│   │   ├── MfaSetupModal.tsx      # 2FA enrolment / disable
│   │   ├── MfaVerifyForm.tsx      # 2FA verify step
│   │   ├── StatCard.tsx           # KPI card widget
│   │   └── types.ts               # Shared types + CSV export utility
│   ├── AdminPinOverlay.tsx        # Staff PIN screen (server-side lockout)
│   ├── MatchResult.tsx            # Animated product match reveal + confetti
│   ├── QuizScreen.tsx             # 8-question swipe interface
│   ├── SwipeCard.tsx              # Draggable card with YES/NO overlays
│   ├── SuccessScreen.tsx          # Post-claim confirmation
│   └── WelcomeScreen.tsx          # Entry screen (name, email, language)
├── config/
│   └── timings.ts                 # All timeout constants (single source of truth)
├── data/
│   ├── products.ts                # Product catalogue + matching algorithm
│   ├── questions.ts               # 8 quiz questions with categories
│   └── stores.ts                  # Store locations + localStorage helpers
├── hooks/
│   ├── useIdleLogout.ts           # Shared admin idle-logout hook
│   ├── useInactivityReset.ts      # Kiosk inactivity reset for quiz
│   ├── useDevicePerformance.ts    # Low/mid/high tier detection
│   ├── useSound.ts                # Sound effects
│   └── useWakeLock.ts             # Prevents iPad screen from sleeping
├── i18n/
│   ├── LanguageContext.tsx        # Language provider
│   └── translations.ts            # Full UI strings in IT, EN, PT, ES, FR
└── pages/
    ├── Index.tsx                  # Main quiz flow orchestrator
    ├── Manager.tsx                # Product catalogue (auth guard)
    └── Stats.tsx                  # Analytics (auth state machine)
```

---

## Database Schema

```sql
quiz_sessions          -- one row per completed quiz (email, product, match %, store)
quiz_funnel_events     -- granular funnel tracking (started / result_shown / claimed)
product_settings       -- active/paused per product per store
admin_access_log       -- PIN attempts with client_id + user_agent (lockout engine)
login_attempts         -- analytics login rate limiting
manager_audit_log      -- product toggle history with author
app_config             -- key-value store (staff PIN bcrypt hash)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone & install
```bash
git clone https://github.com/proganakin/webi-match.git
cd webi-match
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run migrations
Execute all SQL files in `supabase/migrations/` sequentially in the Supabase SQL Editor.

### 4. Set the staff PIN
```sql
INSERT INTO app_config (key, value)
VALUES ('staff_pin_hash', extensions.crypt('YOUR_PIN', extensions.gen_salt('bf')));
```

### 5. Start development server
```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) — the quiz starts immediately.

### Staff access
- **PIN overlay** — long-press the Webidoo logo on the welcome screen (3 seconds)
- **Analytics** — navigate to `/stats` → login with your Supabase credentials
- **Product catalogue** — navigate to `/manager` (requires authenticated session)

---

## Deployment

Webi-Match deploys automatically to Vercel on every push to `main`.

```bash
git push origin main   # triggers build → preview → production
```

No configuration needed beyond the two environment variables above.

---

## Kiosk Setup (iPad)

1. Open Safari on the iPad
2. Navigate to your Vercel production URL
3. Tap **Share → Add to Home Screen** to install as a PWA
4. Enable **Guided Access** in iOS Settings → Accessibility to lock the screen to the app
5. Configure auto-brightness and keep the charger connected
6. Long-press the logo to access the Staff PIN screen and select the correct store

---

## Roadmap

- [ ] Real product catalogue (replacing current placeholders)
- [ ] Product images in `/public/products/`
- [ ] Email automation (consultant video delivery via webhook)
- [ ] CRM integration (HubSpot / Mailchimp sync)
- [ ] A/B testing for question order
- [ ] NFC tap-to-start support

---

## License

MIT © [Webidoo](https://webidoo.it)

---

<div align="center">

Made with ❤️ for the shop floor.

**[webidoo.it](https://webidoo.it)**

</div>
