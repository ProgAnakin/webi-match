# OG Image Specification

The social preview image lives at `public/og-image.png` and is referenced in `index.html` as `https://webi-match.vercel.app/og-image.png`.

## Dimensions

**1280 × 640px** (standard Open Graph / Twitter large card)

## Suggested layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [dark background #0d1117]                                      │
│                                                                  │
│   ┌──────────────────┐    🎯 Webi-Match                         │
│   │  iPad screenshot  │                                          │
│   │  (quiz card mid-  │    iPad-first product discovery kiosk   │
│   │   swipe)          │    for Webidoo Store                    │
│   │                   │                                          │
│   └──────────────────┘    React · TypeScript · Supabase · PWA  │
│                                                                  │
│   Built solo by Costanzo Annichini                              │
└─────────────────────────────────────────────────────────────────┘
```

## Quick generation with Figma / Canva

1. Background: `#0d1117`
2. Accent colour: `#f5831c` (Webidoo orange)
3. Font: Space Grotesk (same as app)
4. Insert `docs/screenshots/quiz.png` on the left (~40% width)
5. Export as PNG, place at `public/og-image.png`

## Quick generation with Node.js (no Figma)

```bash
# Requires @vercel/og or satori
# Or just use a screenshot of the app wrapped in device frame:
npx capture-website https://webi-match.vercel.app \
  --width 1280 --height 640 \
  --output public/og-image.png
```

## Verify

After deploying, test at: https://cards-dev.twitter.com/validator  
And: https://developers.facebook.com/tools/debug/
