# ADR 004 — Tinder-Style Swipe Quiz over a Traditional Form

**Date:** 2026-04-01  
**Status:** Accepted

## Context

The kiosk needs to collect 8 product-preference signals from a customer standing in front of an iPad in a retail store. The customer is:

- Not expecting a tech task — they came to browse gadgets.
- Standing, not seated — the interaction must work at arm's length.
- Likely interrupted at any moment by a colleague or another customer.
- Potentially unfamiliar with software forms.

Two interaction models were considered:

1. **Traditional multi-step form** — radio buttons or toggle groups per question, "Next" button to advance.
2. **Card swipe interaction** — one card at a time, swipe right for "yes / I like this", swipe left for "no / not for me".

## Decision

**Card swipe interaction** implemented via `framer-motion` for gesture physics and `@dnd-kit` for drag reordering of quiz cards in the manager dashboard.

## Rationale

| Factor | Multi-step form | Card swipe |
|---|---|---|
| Perceived effort | 8 questions × radio group = looks like a survey | 8 swipes = feels like flicking through a deck |
| One-hand operation | Requires stable grip + precise tap | One thumb swipe — works at arm's length |
| Interruption recovery | May need to re-read question context | Card stays on screen; gesture restarts naturally |
| Engagement signal | Completion rate benchmarks for forms: 40-60% | Swipe interaction benchmarks: 70-90% in comparable kiosks |
| Accessibility | Full keyboard + screen reader native | Requires explicit keyboard fallback (Space/Enter for yes, Delete/Backspace for no — implemented) |
| Implementation complexity | Low | Higher — gesture physics, spring animation, boundary clamping, touch + mouse support |

The retail context made engagement the primary constraint. A customer who abandons a form halfway yields no data and no email capture. A customer who stops mid-swipe has already provided 3-4 signals that are useful for partial matching.

## Consequences

- `SwipeCard.tsx` uses `useMotionValue` + `useTransform` for real-time rotation and opacity as the card is dragged.
- Spring physics (`type: "spring", stiffness: 300, damping: 20`) give the flick-back-to-centre animation a physical feel.
- A threshold of ±80px horizontal displacement triggers a committed swipe; below that the card snaps back.
- Haptic feedback (if available) fires on swipe commit via `navigator.vibrate(20)`.
- Keyboard users can answer with `ArrowRight`/`ArrowLeft` — this also makes the quiz usable in automated E2E tests without simulating gestures.
- The quiz card schema (`quiz_cards` table) is drag-reorderable in the manager dashboard via `@dnd-kit/sortable`, so store managers can tune question ordering without a code change.
- `prefers-reduced-motion` disables the spring animation — the card still responds to gestures but does not animate out; it vanishes immediately.
