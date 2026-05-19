# LinkedIn Post — Webi-Match

> **Status:** publishing the **English version** first. Italian version is kept below
> as a reference for the local-network follow-up post.

---

## ⭐ Primary post — English (ship this)

> Use as-is. The text below already accounts for real test counts, no placeholders.

---

The iPads in our stores were on. Charged. Untouched.

No one asked me to fix that. No brief, no specs, no official project — I just looked at them long enough and decided to build a reason to touch them.

**Webi-Match** — solo, on my own time, entirely on my own initiative.

It's an iPad kiosk PWA that turns an idle screen into a conversion touchpoint: customers swipe through 8 personalised questions (Tinder-style), get an instant product match, a unique discount code, and a follow-up email in their language — all in under 2 minutes.

It runs in production every day across Webidoo Store locations.

**What's inside:**

→ Swipe interaction with spring physics (Framer Motion) — one-handed at arm's length
→ Deterministic matching algorithm across 8 weighted product categories
→ Multilingual transactional emails (IT / EN / PT / ES / FR) generated server-side by a Deno Edge Function
→ Real-time manager dashboard — sessions, KPIs, filters, product catalog, drag-and-drop quiz authoring
→ Analytics with funnel breakdown per store and per language
→ Defence-in-depth security: RLS on every table, PII encrypted at rest (pgp_sym_encrypt), webhook signing, server-side rate limiting, constant-time PIN comparison, audit logging, role-aware access
→ 75 unit tests + Playwright E2E + GitHub Actions CI
→ Full PWA: splash screens, wake lock, keyboard-aware layout, kiosk mode

**Stack:** React 18 · TypeScript · Vite · Supabase (Postgres + Edge Functions + Realtime) · Tailwind · Framer Motion · @dnd-kit · Sentry · Vercel

Every architectural decision, every line of code, every database migration in the repo is mine.

Open to connecting with builders working on retail tech, kiosk experiences, or React + Supabase stacks at scale. If you're hiring for senior full-stack roles, let's talk.

👉 Repo and live demo in the first comment.

#React #TypeScript #Supabase #FullStack #PWA #RetailTech #SideProject #iPadKiosk #SoloDeveloper

---

### First comment (post immediately after publishing)

```
Live demo (best on iPad in landscape): https://webi-match.vercel.app
Code, ADRs, migrations, runbook: https://github.com/ProgAnakin/webi-match
```

---

## 📌 Italian follow-up — publish 5-7 days after the English post

> Local-network reach. Same project, different angle: more emphasis on the
> store-floor problem and the in-shop result.

---

Gli iPad nei nostri store erano lì. Accesi. Inutilizzati.

Nessuno mi ha chiesto di cambiarli. Niente brief, niente specifiche, nessun progetto ufficiale. Li ho guardati abbastanza a lungo da decidere di costruire un motivo per toccarli.

Ho costruito **Webi-Match** — da solo, nel tempo libero, di mia iniziativa.

È un'app kiosk PWA per iPad che trasforma uno schermo inutilizzato in un touchpoint di conversione: il cliente risponde a 8 domande con un gesto swipe, riceve in tempo reale un prodotto consigliato su misura, un codice sconto unico e un'email personalizzata nella sua lingua — tutto in meno di 2 minuti.

Gira in produzione tutti i giorni nelle sedi Webidoo Store.

**Cosa contiene:**

→ Interfaccia swipe con animazioni fisiche (Framer Motion), pensata per l'uso a una mano
→ Algoritmo di matching deterministico su 8 categorie di prodotto pesate
→ Email transazionali multilingue (IT / EN / PT / ES / FR) costruite server-side da una Edge Function Deno
→ Dashboard manager in real-time — sessioni, KPI, filtri, catalogo, drag-and-drop sulle quiz card
→ Analytics con funnel di conversione per sede e per lingua
→ Sicurezza in profondità: RLS su ogni tabella, PII cifrata a riposo (pgp_sym_encrypt), webhook firmati, rate limiting server-side, confronto PIN constant-time, audit log, controllo accessi per ruolo
→ 75 test unitari + E2E Playwright + GitHub Actions CI
→ PWA completa: splash, wake lock, layout keyboard-aware, modalità kiosk

**Stack:** React 18 · TypeScript · Vite · Supabase · Tailwind · Framer Motion · @dnd-kit · Sentry · Vercel

Ogni decisione architetturale, ogni riga di codice, ogni migration del database è mia.

Sono aperto a connessioni con chi costruisce retail tech, esperienze kiosk, o stack React + Supabase in produzione.

👉 Repository e demo nel primo commento.

#React #TypeScript #Supabase #FullStack #PWA #RetailTech #SideProject #ItalianTech

---

### Primo commento (italiana)

```
Demo live (meglio su iPad in landscape): https://webi-match.vercel.app
Codice, ADR, migration, runbook: https://github.com/ProgAnakin/webi-match
```

---

## 🚀 Second post (1-2 weeks later) — "How I shipped this on a €20/month subscription"

> Different angle: the AI-assisted-development experience. Different audience
> (devs curious about Claude Code workflows + people thinking about AI tooling).
> Draft below — edit your personal voice in.

---

I shipped a production iPad kiosk app — full-stack, multi-tenant, multilingual, with 75 tests, RLS, edge functions, Brevo automation, real-time dashboards — while working 40h/week on the shop floor.

Tool stack for the brain: **Claude Code (€20/month) · ChatGPT · Gemini**.

What that actually looked like, honestly:

**What AI was great at:**
→ Generating migration boilerplate I would have hand-written wrong at 11 PM
→ Spotting RLS gaps I had missed (it caught a USING (true) audit-log policy in one prompt)
→ Translating UI to 5 languages in minutes, not hours
→ Refactoring 800-line files without breaking anything
→ Writing tests for code I had already written
→ Acting as a tireless code reviewer at 1 AM

**What AI was NOT going to do for me:**
→ Decide what the product should be
→ Walk the shop floor and notice the iPads were dead
→ Choose the matching algorithm
→ Sit on a real iPad and feel how the swipe should respond
→ Talk to my manager about deploying it
→ Care if the email arrived

The honest workflow: I made every architectural call. AI made me 3× faster at executing them. Every Friday after closing the shop I would queue up the next sprint of work in plain English, run it, review the diff, push, deploy, test on a real iPad on Saturday morning.

There's a narrative going around that AI either replaces developers or that AI is useless. Neither matches what I lived for the last few months. The truth is:

**AI doesn't replace judgement. It just makes judgement compound faster.**

If you're a developer hesitating to commit to a side project because you "don't have the time" — you might have less excuses than you think.

Repo, deployment, ADRs, runbook → https://github.com/ProgAnakin/webi-match

#AI #ClaudeCode #SoloDeveloper #SideProject #DeveloperProductivity #FullStack #LessonsLearned

---

## 📋 Publishing checklist

Tick before hitting Post on LinkedIn.

- [ ] **Video uploaded natively to LinkedIn** (NOT YouTube link). 90s vertical from `docs/video-script.md`.
- [ ] **Featured on profile** — after publishing, click ⋯ → "Feature on top of profile" so visitors see this first.
- [ ] **LinkedIn headline updated** — example: *"Full-Stack Developer · React · TypeScript · Supabase · Specialist Consultant @ Webidoo Store"*
- [ ] **First comment** posted within 60 seconds — contains the repo + demo links (LinkedIn deprioritises posts with external links in the body).
- [ ] **Engage every reply for the first 24h** — algorithm rewards author engagement.
- [ ] **Time of publication** — Monday 8:30-9:30 CET for international reach.
- [ ] **GitHub repo:** pinned to your profile (github.com → your avatar → "Customize your pins").
- [ ] **GitHub repo:** description + topics filled (topics drive discovery: `react`, `typescript`, `supabase`, `pwa`, `kiosk`, `retail-tech`).
- [ ] **GitHub repo:** the live demo URL in the "About" sidebar.

---

## 🔁 Follow-up cadence

- **+24h after post:** comment a single concrete metric (visits, stars, signups) — creates social proof, re-surfaces the post.
- **+5 days:** publish Italian version for local network.
- **+10-14 days:** publish the AI/€20-subscription post.
- **+30 days:** retrospective — what you learned, what changed at work, where the project went next.
