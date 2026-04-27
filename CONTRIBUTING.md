# Contributing to Webi-Match

## Deployment

**All changes must be committed and pushed directly to `main`.**

Every push to `main` triggers an automatic deploy on Vercel. There is no staging branch — main is always production.

```bash
git add <files>
git commit -m "feat: description of change"
git push origin main
```

## Key Files

| File | Purpose |
|------|---------|
| `src/data/products.ts` | Product catalog + matching algorithm |
| `src/data/questions.ts` | 8 quiz questions (categories: fitness, audio, productivity, camera, travel, gaming, communication, wellness) |
| `src/pages/Index.tsx` | Main flow orchestrator: Welcome → Quiz → Result → Success |
| `src/components/SwipeCard.tsx` | Tinder-style swipe card component |
| `src/i18n/translations.ts` | All UI strings in 5 languages (IT, EN, PT, ES, FR) |
| `src/data/stores.ts` | Store locations and IDs |
| `supabase/functions/` | Edge Functions: email delivery, Google Sheets relay |

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Framer Motion
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Deploy:** Vercel (auto-deploy from `main`)
- **Email:** Brevo API (triggered via Supabase Edge Function)
- **CRM:** Google Sheets relay

## Environment Variables

See `.env.example` for required variables:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Product Images

Place product images in `public/products/` and reference them in `src/data/products.ts`.

## Adding Products

Edit `src/data/products.ts` — each product has an `id`, `name`, `price`, `image`, `category`, `tags`, and scoring weights per quiz question.

## Database Migrations

Supabase migrations live in `supabase/migrations/`. Run them via the Supabase CLI or dashboard.

## Notes

- Products in the current catalog are placeholder/provisional pending final manager approval
- The app is designed for iPad kiosk use (touch-first, no keyboard dependency)
- Inactivity reset triggers after 45 seconds on quiz/result screens
