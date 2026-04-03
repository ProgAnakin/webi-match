# Webi-Match – Istruzioni per Claude Code

## Regola principale: deploy automatico su Vercel

**Tutte le modifiche devono essere committate e pushate direttamente sul branch `main`.**

Non creare branch di feature. Non aprire Pull Request.
Ogni push sulla `main` viene deployato automaticamente su Vercel.

```
# Flusso corretto per ogni modifica:
git add <file>
git commit -m "descrizione della modifica"
git push -u origin main
```

## Progetto

**Webi-Match** è un'app quiz interattiva per esposizioni su iPad (brand Webidoo).
I clienti fanno swipe (stile Tinder) su prodotti tech e trovano il loro "match".
L'email viene raccolta per CRM e newsletter con video del consulente + sconto speciale.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui + Framer Motion
- Supabase (PostgreSQL) per analytics sessioni quiz
- Deploy: Vercel (auto-deploy dal branch `main`)

## File chiave

- `src/data/products.ts` — catalogo prodotti + algoritmo di matching
- `src/data/questions.ts` — 8 domande del quiz (categorie: fitness, audio, productivity, camera, travel, gaming, communication, wellness)
- `src/pages/Index.tsx` — orchestratore del flusso: Welcome → Quiz → Result → Success
- `src/components/SwipeCard.tsx` — componente swipe principale

## Note

- I prodotti attuali sono **fittizi/placeholder** in attesa della decisione del manager sui prodotti reali
- Le immagini dei prodotti vanno in `public/products/`
- Il testo dell'interfaccia è in **italiano**
