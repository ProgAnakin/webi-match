import { useEffect, useRef } from "react";

// ─── Music constants ──────────────────────────────────────────────────────────
const BPM  = 118;
const BEAT = 60 / BPM;   // quarter note ≈ 0.508 s
const BAR  = BEAT * 4;
const STEP = BEAT / 4;   // 16th note ≈ 0.127 s
const AHEAD = 0.14;      // look-ahead buffer in seconds

// I – V – vi – IV  in C major (uplifting / pop-electronic feel)
const CHORDS = [
  { bass: 130.81, pad: [261.63, 329.63, 392.00], arp: [523.25, 659.25, 783.99] }, // C
  { bass:  98.00, pad: [196.00, 246.94, 293.66], arp: [392.00, 493.88, 587.33] }, // G
  { bass: 110.00, pad: [220.00, 261.63, 329.63], arp: [440.00, 523.25, 659.25] }, // Am
  { bass:  87.31, pad: [174.61, 220.00, 261.63], arp: [349.23, 440.00, 523.25] }, // F
] as const;

// 16-step arpeggio pattern per bar (-1 = rest)
// Ascending with rhythmic breathing — clean electronic shop vibe
const ARP = [0, -1, 1, -1, 2,  1, 0, -1,
             0, -1, 1,  2, 1, -1, 0, -1];

const LOOP = 64; // 4 bars × 16 steps

// ─── Low-level helpers ────────────────────────────────────────────────────────

function osc(
  ctx: AudioContext, dest: GainNode,
  freq: number, t: number, dur: number,
  vol: number, type: OscillatorType,
  lpFreq = 0,
) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  if (lpFreq) {
    const f = ctx.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = lpFreq;
    o.connect(f); f.connect(g);
  } else {
    o.connect(g);
  }
  g.connect(dest);
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + Math.min(0.018, dur * 0.2));
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function hat(ctx: AudioContext, dest: GainNode, t: number, vol: number) {
  const n    = Math.ceil(ctx.sampleRate * 0.038);
  const buf  = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src  = ctx.createBufferSource();
  const hp   = ctx.createBiquadFilter();
  const g    = ctx.createGain();
  src.buffer = buf;
  src.connect(hp); hp.connect(g); g.connect(dest);
  hp.type = "highpass"; hp.frequency.value = 8000;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.038);
  src.start(t);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useBgMusic(active: boolean, volume = 0.22) {
  const ctxRef   = useRef<AudioContext | null>(null);
  const destRef  = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextRef  = useRef(0);   // next scheduled step time
  const stepRef  = useRef(0);   // step index in loop

  const schedule = () => {
    const ctx  = ctxRef.current;
    const dest = destRef.current;
    if (!ctx || !dest) return;

    while (nextRef.current < ctx.currentTime + AHEAD) {
      const t  = nextRef.current;
      const si = stepRef.current;
      const bi = Math.floor(si / 16) % 4;   // bar → chord index
      const s  = si % 16;                    // step within bar
      const ch = CHORDS[bi];

      // ── Bass — beats 1 & 3 ──
      if (s === 0) osc(ctx, dest, ch.bass, t, BEAT * 0.52, 0.52, "sine");
      if (s === 8) osc(ctx, dest, ch.bass, t, BEAT * 0.38, 0.34, "sine");

      // ── Chord pad — full bar, soft triangle ──
      if (s === 0) {
        ch.pad.forEach((f, i) =>
          osc(ctx, dest, f, t, BAR, 0.068 - i * 0.014, "triangle")
        );
      }

      // ── Arpeggio lead — 16th notes, square + LP filter ──
      const ai = ARP[s];
      if (ai >= 0)
        osc(ctx, dest, ch.arp[ai], t, STEP * 0.72, 0.062, "square", 1050);

      // ── Hi-hat — every 8th note, very subtle ──
      if (s % 2 === 0) hat(ctx, dest, t, 0.020);

      nextRef.current += STEP;
      stepRef.current  = (si + 1) % LOOP;
    }
  };

  useEffect(() => {
    if (active) {
      try {
        const AC = window.AudioContext ?? (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext;
        const ctx = new AC();
        if (ctx.state === "suspended") ctx.resume();

        const master = ctx.createGain();
        master.gain.setValueAtTime(0, ctx.currentTime);
        master.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2.0);
        master.connect(ctx.destination);

        ctxRef.current  = ctx;
        destRef.current = master;
        nextRef.current = ctx.currentTime + 0.06;
        stepRef.current = 0;

        timerRef.current = setInterval(schedule, 50);
      } catch {
        // AudioContext unavailable — silently skip
      }

      return () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      };
    } else {
      // Fade out
      if (destRef.current && ctxRef.current) {
        const g   = destRef.current;
        const ctx = ctxRef.current;
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
        const closing = ctx;
        setTimeout(() => closing.close().catch(() => {}), 1600);
      }
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      ctxRef.current  = null;
      destRef.current = null;
    }
  }, [active]);
}
