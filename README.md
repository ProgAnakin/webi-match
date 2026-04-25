# Webi-Match
### AI Product Matching Kiosk · Live in Production · 4 Retail Stores

> **Swipe. Match. Buy.**

Built while working full-time as a sales specialist at Webidoo Store, Milan.
Deployed on iPads across all store locations. Operational in production.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-2.101-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

---

## What is this?

A retail kiosk application deployed on iPads across all 4 Webidoo Store locations in Milan.

Customers answer 8 lifestyle questions via a Tinder-style swipe interface.
The app returns a personalised product recommendation with:

- A compatibility score (45–98%)
- An exclusive discount code
- A consultant video
- A personalised email with dynamic FAQs

---

## How It Works

```
AttractScreen (idle kiosk)
    ↓ tap
SplashScreen (language selection)
    ↓
WelcomeScreen (name + email + validation)
    ↓
QuizScreen (8 swipe cards)
    ↓
MatchResult (matched product + compatibility score + CTA)
    ↓
SuccessScreen (email sent confirmation)
    ↓ inactivity
AttractScreen
```

---

## Business Impact

| Metric | Detail |
|--------|--------|
| **Lead capture** | Every session collects name + email directly into CRM |
| **Locations** | Corso Vercelli · 5 Giornate · Verona · Bergamo |
| **Analytics** | Real-time funnel conversion dashboard |
| **Languages** | 5 — Italian, English, Portuguese, Spanish, French |
| **Email automation** | Transactional email with discount code on every match |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · TypeScript 5 · Vite |
| Styling | Tailwind CSS · Framer Motion · shadcn/ui |
| Backend | Supabase (PostgreSQL · RLS · Edge Functions) |
| Email | Brevo API · Deno runtime |
| Deploy | Vercel |
| Testing | Vitest · Playwright · Testing Library |
| Native | Capacitor (iOS/Android ready) |

---

## Kiosk Features

| Feature | Detail |
|---------|--------|
| Inactivity reset | 30s countdown → haptic feedback → auto reset |
| Wake Lock | Screen always on — no iPad sleep |
| Haptic feedback | On every swipe |
| Sound effects | YES/NO audio via Web Audio API |
| Anti-spam | Same email blocked for N hours |
| PWA | Installable on iPad via Safari |
| i18n | 5 languages — full UI coverage |

---

## Codebase

| Metric | Value |
|--------|-------|
| Source lines | ~5,100 |
| React components | 22 |
| Custom hooks | 7 |
| Routes | 5 |
| Languages supported | 5 |
| Products in catalogue | 10 |

---

*Built on the shop floor. Shipped to production.*
