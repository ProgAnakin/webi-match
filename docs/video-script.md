# Video Script — Webi-Match Demo (90 seconds)

*Recommended format: vertical iPad screen recording (1024×1366), voice-over,
burnt-in subtitles. Upload natively to LinkedIn — native video reaches 5–10×
more people than an external link.*

---

## Timeline

| Segment | Duration | On screen | Audio |
|---|---|---|---|
| Visual hook | 0–5s | Animated attract loop | Soft ambient pad |
| The problem | 5–15s | Voice-over on attract | "These iPads were sitting there, untouched…" |
| Quiz start | 15–25s | Tap → language → form | Silent demo, ambient continues |
| Quiz swipes | 25–50s | 4–5 quick swipes | "Eight questions. One at a time." |
| Match result | 50–65s | Result screen | "Instant match + unique discount code." |
| Manager dashboard | 65–80s | Sessions / catalog tabs | "Everything tracked in real-time on the back end." |
| CTA | 80–90s | Repo / profile shot | "Code on GitHub. Link in the comments." |

---

## Voice-over script (English · 90 seconds)

```
[0s — attract loop]
These iPads were sitting in our stores, untouched.
So I built a reason to pick them up.

[10s — tap on attract]
Webi-Match — an iPad kiosk PWA. Solo, on my own time, no brief.

[15s — language pick]
Customer picks a language. Italian, English, Portuguese, Spanish, French.

[20s — name + email form]
Enters name and email. The keyboard layout adapts without breaking the
fullscreen kiosk mode.

[28s — first swipe]
Eight questions. One at a time. Swipe right for yes, left for no —
like flipping through a deck of cards.

[45s — result screen]
Instant match. Recommended product, compatibility percentage, a unique
discount code, and a personalised email already on its way.

[55s — manager dashboard]
On the back end: a real-time manager dashboard. Sessions, product
catalog, drag-and-drop quiz authoring.

[65s — sessions tab with filters]
Every session is tracked. Filter by date, product, match percentage.
Mark codes as redeemed at the counter.

[75s — architecture quick shot]
Under the hood: React, TypeScript, Supabase with RLS and PII encryption,
Deno Edge Functions, 75 automated tests, GitHub Actions CI.

[82s — CTA]
Code is on GitHub. Link in the comments.
If you like what you saw — let's connect.
```

---

## Production notes

### Capturing the footage

- iPad kiosk shots: Chrome/Brave DevTools → device toolbar → **iPad Pro 11" (1024×1366), portrait**.
- Manager dashboard shots: switch to **landscape 1366×1024**.
- Try to capture at least one elastic swipe — the spring physics on the rebound is the most photogenic detail of the whole app.
- For real-iPad recording: AirPlay to a Mac → record with QuickTime → MP4. Higher fidelity than DevTools but more setup.

### Editing

Quick ffmpeg pass to compress and normalise framerate before upload:

```bash
ffmpeg -i raw-recording.mov \
  -vf "scale=720:-1:flags=lanczos,fps=30" \
  -c:v libx264 -crf 23 -preset fast \
  -c:a aac -b:a 128k \
  demo-linkedin.mp4

# Upload demo-linkedin.mp4 directly to LinkedIn — do NOT link to YouTube.
# Native video reaches 5–10× more people than an external link.
```

### Subtitles

Generate burnt-in subtitles with [auto-subtitle](https://github.com/abdeladim-s/subsai) or [Whisper](https://github.com/openai/whisper), then attach the `.srt` file when uploading to LinkedIn. ~70% of LinkedIn users watch with sound off — subtitles add 20–30% to reach.

```bash
# Whisper baseline (English, large model — best quality, slow)
whisper demo-linkedin.mp4 --language English --model large --output_format srt
```

### Music

Pick a track that's:
- Calm but not sleepy (keep ambient bed under -18 LUFS so voice cuts through)
- Royalty-free for commercial use on LinkedIn (Epidemic Sound, Artlist, or YouTube Audio Library)
- Avoid drops at the wrong moment — keep the energy curve flat, the visuals carry the rhythm

---

## Short version (30 seconds — Reels / Stories / X)

| Segment | Duration | Content |
|---|---|---|
| Hook | 0–3s | Overlay: *"I built this solo, on my own time."* |
| Quiz swipes | 3–15s | 4 quick swipes with music |
| Match result | 15–22s | Result + discount code |
| CTA | 22–30s | Stack overlay (React · TypeScript · Supabase · Edge Functions) + *"GitHub in the comments"* |

No voice-over on this one — pure motion + on-screen text. Designed for sound-off scrolling.

---

## Naming and post hygiene

- Filename: `webi-match-demo-90s.mp4` (filename appears in the LinkedIn post metadata, keep it on-brand).
- Thumbnail / first frame: must work as a static preview — pick a moment with the result screen visible, NOT the attract loop (most LinkedIn viewers see a still frame first and tap to play).
- Alt text on the LinkedIn upload: *"90-second demo of Webi-Match: an iPad kiosk PWA for product discovery, with manager dashboard."* (helps reach + accessibility.)
