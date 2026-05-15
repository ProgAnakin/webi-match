# Video Script — Webi-Match Demo (90 seconds)

*Formato consigliato: screen recording iPad verticale 1024×1366, narrazione in voce, sottotitoli. Carica direttamente su LinkedIn.*

---

## Struttura

| Segmento | Durata | Schermo | Audio |
|---|---|---|---|
| Hook visivo | 0–5s | Attract loop animato | Musica ambientale generativa |
| Il problema | 5–15s | Voce over su attract | "Gli iPad erano lì, inutilizzati..." |
| Inizio quiz | 15–25s | Tap → lingua → form | Dimostrazione silenziosa |
| Swipe quiz | 25–50s | 4-5 swipe veloci | "8 domande, una gestione alla volta" |
| Match result | 50–65s | Schermata risultato | "Match istantaneo + codice sconto" |
| Dashboard | 65–80s | Tab sessioni / catalogo | "Il manager vede tutto in real-time" |
| CTA | 80–90s | Repo / connessione | "Codice su GitHub — link nei commenti" |

---

## Script parlato (italiano, 90 secondi)

```
[0s — attract loop]
Questi iPad stavano in store senza che nessuno li usasse.
Così ho costruito un motivo per toccarli.

[10s — tap sull'attract]
Webi-Match: un kiosk PWA che gira su iPad, costruito da zero,
da solo, nel tempo libero.

[15s — selezione lingua]
Il cliente sceglie la lingua — italiano, inglese, portoghese,
spagnolo o francese.

[20s — form nome/email]
Inserisce nome e email. L'interfaccia gestisce la tastiera
virtuale senza rompere il fullscreen.

[28s — inizio swipe]
Otto domande. Una alla volta. Si risponde con uno swipe.
Come sfogliare una mazzo di carte.

[45s — schermata risultato]
Risultato istantaneo. Prodotto consigliato, percentuale di match,
codice sconto unico e un'email personalizzata — già in arrivo.

[55s — dashboard manager]
Sul backend: dashboard manager con sessioni in tempo reale,
catalogo prodotti, configurazione quiz.

[65s — tab sessioni con filtri]
Il manager vede ogni sessione, filtra per data, prodotto,
percentuale di match. Può segnare i codici come riscattati.

[75s — codice / architettura]
Sotto il cofano: React, TypeScript, Supabase con RLS e cifratura
PII, Edge Functions Deno, 78 test automatizzati, CI GitHub Actions.

[82s — CTA]
Il codice è pubblico su GitHub. Link nei commenti.
Se ti piace quello che hai visto, colleghiamoci.
```

---

## Note di regia

### Catturare
- Usa DevTools → device "iPad Pro 11" (1024×1366 portrait) per il kiosk.
- Per il dashboard, usa landscape 1366×1024.
- Prova a catturare almeno una swipe "elastica" — il rimbalzo fisico è il dettaglio più impressionante.

### Montaggio
```bash
# Taglia + comprimi con ffmpeg
ffmpeg -i raw-recording.mov \
  -vf "scale=720:-1:flags=lanczos,fps=30" \
  -c:v libx264 -crf 23 -preset fast \
  -c:a aac -b:a 128k \
  demo-linkedin.mp4

# Carica demo-linkedin.mp4 direttamente su LinkedIn (non YouTube)
# Il video nativo ha 5-10× più reach del link esterno
```

### Sottotitoli
Genera con `auto-subtitle` o Whisper e aggiungi il file `.srt` quando carichi su LinkedIn — aumenta il reach del 20-30% (molti guardano senza audio).

---

## Versione breve (30 secondi — per Reel/Story/Twitter)

| Segmento | Durata | Contenuto |
|---|---|---|
| Hook | 0–3s | "Construí esto solo, en mi tiempo libre" (overlay text) |
| Swipe quiz | 3–15s | 4 swipe veloci con musica |
| Match result | 15–22s | Risultato + codice sconto |
| CTA | 22–30s | Stack tecnologico in overlay + "GitHub nei commenti" |
