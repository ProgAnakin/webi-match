# Screenshots & Demo Assets

This directory holds the visual assets referenced in the top-level `README.md`. Capture these on an iPad (or a 1024×1366 viewport in DevTools' device emulation) so the proportions match the production deployment.

## Required assets

| File | Source view | Suggested resolution | Notes |
|---|---|---|---|
| `attract.png`    | Idle attract screen at `/`                                | 1024 × 1366 portrait | Wait ~30s on `/` so the attract loop is fully visible. |
| `welcome.png`    | Welcome + name/email form (after tapping the attract)      | 1024 × 1366 portrait | Show the language switcher in the top-right. |
| `quiz.png`       | A mid-quiz card mid-swipe                                  | 1024 × 1366 portrait | Capture the swipe motion frame if possible. |
| `result.png`     | The match-result screen with discount code                 | 1024 × 1366 portrait | Use a demo name like `Hi Demo!` for the screenshot — never a real customer. |
| `manager.png`    | `/manager` → Sessions tab with a realistic session list    | 1366 × 1024 landscape | Use a seeded demo store, **no real customer PII**. |
| `demo.gif`       | 20-30 second screen recording of the full flow            | 1024 × 1366 portrait | Compress with `gifski` or `ffmpeg` → < 5 MB. |

## How to capture cleanly

### From an iPad
1. Open the deployed site in standalone (Add to Home Screen).
2. `Side button + Volume Up` to screenshot.
3. AirDrop the PNGs to your Mac.

### From a desktop
1. `npm run dev` and open `http://localhost:8080`.
2. Open DevTools → Toolbar → Toggle device toolbar (`Ctrl/Cmd+Shift+M`).
3. Pick "iPad Pro 11" (1024 × 1366).
4. Use the DevTools "Capture screenshot" command (`Ctrl/Cmd+Shift+P` → "Capture screenshot").

### For the GIF
```bash
# Record with QuickTime (Mac) → demo.mov
# Then convert:
ffmpeg -i demo.mov -vf "fps=15,scale=720:-1:flags=lanczos" -c:v gif demo.gif
# Or, smaller and crisper:
gifski --fps 15 --width 720 --output demo.gif demo.mov
```

## ⚠️ Privacy

**Never commit screenshots containing real customer PII.** Use seed data or anonymise:
- Names → `Demo`, `Test`, `Esempio`
- Emails → `demo@example.com`
- Discount codes → can be left, they are short-lived and per-session

## Branding

When framing screenshots for LinkedIn / portfolio posts, the device frame matters more than people expect. Use [mockphone.com](https://mockphone.com) or Figma's iPad mockup to wrap the PNGs in an iPad chrome — it makes a screenshot feel like a product shot.
