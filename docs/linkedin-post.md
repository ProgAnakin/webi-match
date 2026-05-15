# LinkedIn Post — Webi-Match

*Copy pronta para publicar. Escolha entre a versão italiana (rede local) ou inglesa (alcance global). Substitua os marcadores entre colchetes antes de publicar.*

---

## Versione italiana (consigliata per la rete locale)

---

Gli iPad nei nostri store erano lì. Accesi. Inutilizzati.

Nessuno ci chiedeva di cambiarli. Nessun brief, nessuna specifica, nessun progetto ufficiale.
Li ho semplicemente guardati troppo a lungo e ho deciso di fare qualcosa.

Ho costruito **Webi-Match** — da solo, nel tempo libero, di mia iniziativa.

È un'app kiosk PWA per iPad che trasforma uno schermo inutilizzato in un touchpoint di conversione:
il cliente risponde a 8 domande con un gesto swipe (tipo Tinder), riceve in tempo reale un prodotto consigliato su misura, un codice sconto unico e un'email personalizzata nella sua lingua.

---

**Cosa ho costruito:**

→ Interfaccia swipe con animazioni fisiche (Framer Motion) e gesture a una mano
→ Algoritmo di matching deterministico su 8 categorie di prodotto
→ Email transazionale multilingue (IT / EN / PT / ES / FR) via Brevo + Edge Function Deno
→ Dashboard manager con sessioni in real-time (Supabase Realtime), filtri avanzati, catalogo prodotti, drag-and-drop quiz cards
→ Analytics dashboard con funnel di conversione e breakdown per store
→ Modello di sicurezza completo: RLS su ogni tabella, PII cifrata a riposo (AES/pgp_sym_encrypt), rate limiting server-side, protezione CORS, audit log
→ 78 test unitari (Vitest) + 7 test E2E (Playwright) + CI GitHub Actions
→ PWA con splash screen, wake lock e keyboard-aware layout per iPad in fullscreen

---

**Stack:** React 18 · TypeScript · Vite · Supabase (PostgreSQL + Edge Functions + Realtime) · Tailwind · Framer Motion · @dnd-kit · Sentry · Vercel

Il codice è su GitHub. Il progetto gira ogni giorno in produzione su iPad nelle sedi Webidoo Store.

👉 [Link al repo GitHub]
👉 [Link al tuo profilo LinkedIn / portfolio]

#React #TypeScript #Supabase #PWA #FullStack #OpenSource #SideProject #WebDevelopment #iPad #RetailTech

---

## English version (recommended for broader reach)

---

The iPads in our stores were on. Charged. Untouched.

No one asked me to fix that. No brief. No specs. No official project.
I just stared at them long enough and decided to do something about it.

I built **Webi-Match** — solo, on my own time, entirely on my own initiative.

It's an iPad kiosk PWA that turns an idle screen into a conversion touchpoint:
customers swipe through 8 personalised questions (Tinder-style), get an instant product recommendation, a unique discount code, and a follow-up email in their own language — all in under 2 minutes.

---

**What I built:**

→ Swipe interaction with spring physics (Framer Motion) — designed for one-handed use at arm's length
→ Deterministic product-matching algorithm across 8 weighted categories
→ Multilingual transactional emails (IT/EN/PT/ES/FR) — Edge Function builds the entire email in the customer's chosen language
→ Real-time manager dashboard — sessions, KPI cards, advanced filters, product catalogue, drag-and-drop quiz configuration
→ Analytics dashboard with conversion funnel and per-store breakdowns
→ Defence-in-depth security model: RLS on every table, PII encrypted at rest (AES/pgp_sym_encrypt), server-side rate limiting, strict CORS, audit logging
→ 78 unit tests + 7 E2E tests + GitHub Actions CI
→ Full PWA: splash screens, wake lock, keyboard-aware layout for iPad fullscreen mode

---

**Stack:** React 18 · TypeScript · Vite · Supabase · Tailwind · Framer Motion · @dnd-kit · Sentry · Vercel

The code is on GitHub. It runs in production every day on iPads in Webidoo Store locations.

I'm [looking for new opportunities / open to connecting with builders / happy to discuss the architecture] — let's talk.

👉 [GitHub repo link]
👉 [Your portfolio / website]

#React #TypeScript #Supabase #PWA #FullStack #SideProject #WebDevelopment #RetailTech #iPad #OpenToWork

---

## Tips per massimizzare la portata

1. **Pubblica il video prima del testo** — carica il video direttamente su LinkedIn (non YouTube). Il video nativo raggiunge 5-10× più persone del link.
2. **Primo commento = link al repo** — metti il link GitHub nel primo commento, non nel post. LinkedIn penalizza i post con link esterni nel corpo.
3. **Immagine cover** — usa `docs/screenshots/manager.png` avvolta nel frame iPad come prima immagine del carosello.
4. **Ora ottimale** — martedì o mercoledì mattina (8:30-9:30) per la rete italiana, lunedì mattina per la rete internazionale.
5. **Tag** — tagga Webidoo Store (se hai il permesso) nella prima riga per aumentare l'organico.
6. **Follow-up** — 24h dopo, posta un secondo commento con un dato concreto: "In 24h: X visite, Y stelle GitHub" (anche se piccolo, crea FOMO).
