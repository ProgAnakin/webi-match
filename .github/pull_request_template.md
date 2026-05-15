## What does this PR do?

<!-- One paragraph. Focus on the *why*, not the *what* — the diff shows the what. -->

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change (requires migration or config update)
- [ ] Refactor / chore (no behaviour change)
- [ ] Docs / i18n only

## Checklist

- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes (or new tests added for new behaviour)
- [ ] `npm run build` succeeds
- [ ] No `.env`, secrets, or real customer PII committed
- [ ] New DB table? → RLS policies included, migration is idempotent
- [ ] New Edge Function? → `escHtml()` / `safeUrl()` used on all user input, `ALLOWED_ORIGIN` checked
- [ ] New UI component? → tap target ≥ 44×44px, `focus-visible` ring applied, `aria-*` on interactive elements
- [ ] New copy (UI string)? → added to all 5 languages in `src/i18n/translations.ts`
- [ ] CHANGELOG updated (if user-facing)

## Screenshots / demo

<!-- Required for any visual change. Blur customer PII. -->

## Related issues

<!-- Closes #... -->
