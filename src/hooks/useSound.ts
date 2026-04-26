import { useCallback, useEffect } from "react";

/**
 * Unified sound system — Web Audio API, singleton AudioContext.
 * All sounds are synthesized (no files). Professional & delicate:
 * short, low-volume, clean sine/triangle waves.
 *
 * Sounds:
 *  swipe_yes  — single soft ascending note (positive feedback)
 *  swipe_no   — single soft neutral note (neutral feedback)
 *  start      — two-note gentle chime (quiz begins)
 *  match      — rising arpeggio + tail (match revealed)
 *  success    — warm resolved major chord (completion)
 */

// ─── Singleton AudioContext ───────────────────────────────────────────────────
// Reused across all calls — avoids per-sound creation overhead and iOS limits.
let _ctx: AudioContext | null = null;
let _unlocked = false;

function getCtx(): AudioContext | null {
  try {
    if (!_ctx || _ctx.state === "closed") {
      _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (_ctx.state === "suspended") {
      _ctx.resume(); // async, best-effort — real unlock happens via unlockAudio()
    }
    return _ctx;
  } catch {
    return null;
  }
}

/**
 * iOS/Safari requires AudioContext to be created AND a buffer played
 * inside the first user-gesture call stack. We call this once on the
 * first touchstart/mousedown so subsequent sounds work reliably.
 */
function unlockAudio() {
  if (_unlocked) return;
  _unlocked = true;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    // Play an inaudible 1-sample buffer — forces the context to "running".
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    src.disconnect();
  } catch {
    // Ignore — older browsers may not support this pattern
  }
}

// ─── Primitive: play a single sine tone ──────────────────────────────────────
function tone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

// ─── Sound definitions ────────────────────────────────────────────────────────
function playSwipeYes() {
  const ctx = getCtx(); if (!ctx) return;
  // Single soft ascending note — A5, very short, barely there
  tone(ctx, 880, ctx.currentTime, 0.09, 0.09);
}

function playSwipeNo() {
  const ctx = getCtx(); if (!ctx) return;
  // Single neutral note — E5, slightly softer, same duration
  tone(ctx, 659.25, ctx.currentTime, 0.09, 0.07);
}

function playStart() {
  const ctx = getCtx(); if (!ctx) return;
  // Two-note gentle ascending chime: G4 → C5
  const t = ctx.currentTime;
  tone(ctx, 392, t,        0.12, 0.10);
  tone(ctx, 523.25, t + 0.13, 0.15, 0.10);
}

function playMatch() {
  const ctx = getCtx(); if (!ctx) return;
  // Rising arpeggio C5 → E5 → G5 → C6 + descending tail
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const step = 0.18;
  const t = ctx.currentTime;
  notes.forEach((freq, i) => tone(ctx, freq, t + i * step, 0.14, 0.14));
  // Gentle tail: C6 → A5
  const tailStart = t + notes.length * step;
  const tail = ctx.createOscillator();
  const tailGain = ctx.createGain();
  tail.connect(tailGain); tailGain.connect(ctx.destination);
  tail.type = "sine";
  tail.frequency.setValueAtTime(1046.5, tailStart);
  tail.frequency.exponentialRampToValueAtTime(880, tailStart + 0.35);
  tailGain.gain.setValueAtTime(0.10, tailStart);
  tailGain.gain.exponentialRampToValueAtTime(0.001, tailStart + 0.45);
  tail.start(tailStart); tail.stop(tailStart + 0.46);
}

function playSuccess() {
  const ctx = getCtx(); if (!ctx) return;
  // Warm major chord: C5 + E5 + G5 together, soft and resolved
  const t = ctx.currentTime + 0.05;
  tone(ctx, 523.25, t, 0.5, 0.08);
  tone(ctx, 659.25, t, 0.5, 0.07);
  tone(ctx, 783.99, t, 0.5, 0.06);
  // Brief high shimmer on top
  tone(ctx, 1046.5, t + 0.05, 0.25, 0.05);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export type SoundType = "swipe_yes" | "swipe_no" | "start" | "match" | "success";

export function useSound() {
  // Register the one-time unlock on the first user gesture.
  // useEffect runs client-side only; { once: true } auto-removes the listener.
  useEffect(() => {
    const handle = () => unlockAudio();
    window.addEventListener("touchstart", handle, { once: true, passive: true });
    window.addEventListener("mousedown",  handle, { once: true, passive: true });
    return () => {
      window.removeEventListener("touchstart", handle);
      window.removeEventListener("mousedown",  handle);
    };
  }, []);

  const play = useCallback((sound: SoundType) => {
    try {
      switch (sound) {
        case "swipe_yes": playSwipeYes(); break;
        case "swipe_no":  playSwipeNo();  break;
        case "start":     playStart();    break;
        case "match":     playMatch();    break;
        case "success":   playSuccess();  break;
      }
    } catch {
      // Silently ignore — AudioContext blocked or unavailable
    }
  }, []);
  return { play };
}
