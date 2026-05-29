# Contributing

Thanks for your interest in Webi-Match. This is primarily a personal project authored by Costanzo Annichini, but contributions, bug reports and ideas are welcome.

## Ground Rules

- **Be respectful.** Code review is for the code, not the author.
- **Open an issue before a big PR.** A 5-line bug fix needs no warning; a 500-line refactor should be discussed first.
- **One concern per PR.** Don't mix a feature, a refactor, and a styling change. Small, focused PRs get merged faster.
- **No new dependencies without justification.** The repo is intentionally lean — `package.json` is auditable. Adding a dep is fine, but explain the trade-off in the PR description.
- **Don't commit secrets.** Never commit a `.env`, a Supabase service role key, a Brevo API key, or anything that should live in Vercel / Supabase Dashboard.

## Development Setup

```bash
git clone <repo>
cd webi-match
npm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

The dev server runs on `http://localhost:8080` with HMR.

## Branching

| Branch prefix | Purpose | CI |
|---|---|---|
| `main` | Production. Auto-deploys via Vercel. | ✅ |
| `feat/<topic>` | New feature work | ✅ |
| `fix/<topic>` | Bug fix | ✅ |
| `claude/<topic>` | AI-assisted exploratory work | ✅ |
| `release/<version>` | Release candidate | ✅ |

Open PRs against `main`. Squash-merge is the default.

## Quality Gates

Every PR must pass the CI pipeline:

```bash
npm run lint        # ESLint
npx tsc --noEmit    # TypeScript strict typecheck
npm test            # Vitest unit + integration tests
npm run test:e2e    # Playwright E2E (requires test:e2e:install first)
npm run build       # Production build smoke test
```

End-to-end Playwright tests live in `e2e/`. Run them locally with:

```bash
npx playwright install   # one-time
npx playwright test
```

## Code Style

- **TypeScript everywhere.** No new `.js` / `.jsx` files unless absolutely required.
- **Functional React.** No class components.
- **Tailwind first, custom CSS as escape hatch.** Don't add a `.css` file when a utility class will do.
- **Hooks for cross-cutting concerns.** Anything used in two or more components → extract a hook to `src/hooks/`.
- **No premature abstraction.** Three similar lines is better than a helper that's used once.
- **Comments explain *why*, not *what*.** Well-named identifiers already document the *what*. Use a comment only when there is a hidden constraint, a subtle invariant, or a workaround that would surprise the next reader.
- **No emojis in code or commits** unless the file is user-facing (translations, email templates).

## Commit Messages

Conventional-ish, free-form. Examples that pass review:

```
feat: drag-and-drop quiz cards via @dnd-kit
fix: escape % and _ in session search to prevent SQL injection
chore: extract resizeImage to src/lib/imageProcessing.ts
docs: add Mermaid architecture diagram to README
```

If the work was AI-assisted, that's fine — the tool is a means, not a credit. State the intent of the commit, not the methodology.

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/Index.tsx` | Main flow orchestrator: Attract → Welcome → Quiz → Result → Success |
| `src/data/products.ts` | Product catalog + matching algorithm |
| `src/data/quiz-cards.ts` | Dynamic quiz question schema |
| `src/data/stores.ts` | Store locations and IDs |
| `src/i18n/translations.ts` | All UI strings in 5 languages (IT, EN, PT, ES, FR) |
| `src/components/SwipeCard.tsx` | Tinder-style swipe card component |
| `src/components/manager/` | Manager dashboard (sessions, catalog, quiz cards, email) |
| `supabase/functions/` | Edge Functions: email delivery, PIN verification, Sheets relay |
| `supabase/migrations/` | Versioned SQL migrations (RLS, encryption, RPCs) |

## SQL Migrations

- One file per migration, named `YYYYMMDDHHMMSS_<verb>_<noun>.sql`.
- Idempotent where possible (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`).
- RLS policies are mandatory on any new table that holds user data.
- Document the *purpose* of the migration at the top of the file in a comment block.
- Test against a fresh Supabase project before opening the PR.

## Edge Functions

- Deno-based, deployed via `supabase functions deploy <name>`.
- Secrets live in **Supabase Dashboard → Edge Functions → Secrets**, never in code or env files.
- Use `escHtml()`, `safeUrl()` and similar utilities for any user-supplied data that lands in an HTML email or response body.
- Log errors with context (`console.error("[function-name] description:", err.message)`) so they show up usefully in Supabase logs.

## Adding a Product

Edit `src/data/products.ts` — each product needs an `id`, `name`, `price`, `image`, `category`, `tags`, and scoring weights per quiz question. Custom per-store products can be added via the manager dashboard (`/manager` → Catalogo → Aggiungi).

## Adding a Language

1. Add the new language code to the `Lang` union in `src/i18n/translations.ts`.
2. Add the matching entry to the `LANGUAGES` array (code, flag, label, name).
3. Add a complete translation object — TypeScript will tell you which keys are missing.
4. Add the matching `EMAIL_I18N` entry in `supabase/functions/on-session-created/index.ts` so transactional emails are also translated.

## Reporting Security Issues

Don't open a public issue. See [`SECURITY.md`](./SECURITY.md) for the private disclosure flow.

## License

By contributing, you agree that your work will be licensed under the project's proprietary license. The project is © Costanzo Annichini — see [`README.md`](./README.md#-license) for details.
