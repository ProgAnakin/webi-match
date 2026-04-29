import { useEffect, useRef } from "react";

export type MusicTrack = "attract" | "welcome" | "quiz";

// ─── Shared audio primitives ──────────────────────────────────────────────────

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

// ─── Track configurations ─────────────────────────────────────────────────────

interface Chord { bass: number; pad: number[]; arp: number[] }

interface TrackConfig {
  bpm:        number;
  volume:     number;
  fadeIn:     number;
  chords:     Chord[];
  arp:        number[];       // 16-step pattern (-1 = rest, 0/1/2 = chord arp index)
  bassBeats:  number[];       // which steps trigger bass
  bassVol:    number;
  bassLen:    number;         // multiplier of BEAT
  padVol:     number;
  padVolStep: number;         // per-voice volume decrement
  arpType:    OscillatorType;
  arpVol:     number;
  arpLp:      number;         // lowpass cutoff (0 = bypass)
  hatBeats:   number[];
  hatVol:     number;
}

const TRACKS: Record<MusicTrack, TrackConfig> = {

  // ── ATTRACT: Atmospheric ambient ─────────────────────────────────────────────
  // Slow, spacious, mysterious — draws attention from across the store.
  // Am → Dm → C → G  |  72 BPM  |  no percussion  |  high-octave sine pings
  attract: {
    bpm:        72,
    volume:     0.15,
    fadeIn:     4.0,
    chords: [
      { bass: 110.00, pad: [220.00, 261.63, 329.63], arp: [880.00, 1046.50, 1318.51] }, // Am
      { bass: 146.83, pad: [293.66, 349.23, 440.00], arp: [1174.66, 1396.91, 1760.00] }, // Dm
      { bass: 130.81, pad: [261.63, 329.63, 392.00], arp: [1046.50, 1318.51, 1567.98] }, // C
      { bass: 196.00, pad: [196.00, 246.94, 293.66], arp: [784.00,  987.77,  1174.66] }, // G
    ],
    arp:        [-1, -1, 0, -1, -1, -1, -1, -1, 2, -1, -1, -1, 1, -1, -1, -1],
    bassBeats:  [0],
    bassVol:    0.18,
    bassLen:    1.8,
    padVol:     0.040,
    padVolStep: 0.009,
    arpType:    "sine",
    arpVol:     0.028,
    arpLp:      0,
    hatBeats:   [],
    hatVol:     0,
  },

  // ── WELCOME: Warm focus ───────────────────────────────────────────────────────
  // Moderate, positive, clean — calming yet forward-moving.
  // C → F → Am → G  |  96 BPM  |  sine arp  |  soft quarter-note pulse
  welcome: {
    bpm:        96,
    volume:     0.18,
    fadeIn:     2.5,
    chords: [
      { bass: 130.81, pad: [261.63, 329.63, 392.00], arp: [523.25, 659.25, 783.99] }, // C
      { bass: 174.61, pad: [174.61, 220.00, 261.63], arp: [349.23, 440.00, 523.25] }, // F
      { bass: 110.00, pad: [220.00, 261.63, 329.63], arp: [440.00, 523.25, 659.25] }, // Am
      { bass: 196.00, pad: [196.00, 246.94, 293.66], arp: [392.00, 493.88, 587.33] }, // G
    ],
    arp:        [0, -1, 1, -1, -1, 2, -1, -1, 1, -1, 0, -1, 2, -1, -1, -1],
    bassBeats:  [0, 8],
    bassVol:    0.30,
    bassLen:    0.50,
    padVol:     0.055,
    padVolStep: 0.011,
    arpType:    "sine",
    arpVol:     0.042,
    arpLp:      1600,
    hatBeats:   [0, 4, 8, 12],
    hatVol:     0.009,
  },

  // ── QUIZ: Electronic drive ────────────────────────────────────────────────────
  // Energetic, engaging — peak of the sonic arc.
  // C → G → Am → F  |  118 BPM  |  square+LP arp  |  dense 8th-note hi-hats
  quiz: {
    bpm:        118,
    volume:     0.22,
    fadeIn:     2.0,
    chords: [
      { bass: 130.81, pad: [261.63, 329.63, 392.00], arp: [523.25, 659.25, 783.99] }, // C
      { bass:  98.00, pad: [196.00, 246.94, 293.66], arp: [392.00, 493.88, 587.33] }, // G
      { bass: 110.00, pad: [220.00, 261.63, 329.63], arp: [440.00, 523.25, 659.25] }, // Am
      { bass:  87.31, pad: [174.61, 220.00, 261.63], arp: [349.23, 440.00, 523.25] }, // F
    ],
    arp:        [0, -1, 1, -1, 2, 1, 0, -1, 0, -1, 1, 2, 1, -1, 0, -1],
    bassBeats:  [0, 8],
    bassVol:    0.52,
    bassLen:    0.52,
    padVol:     0.068,
    padVolStep: 0.014,
    arpType:    "square",
    arpVol:     0.062,
    arpLp:      1050,
    hatBeats:   [0, 2, 4, 6, 8, 10, 12, 14],
    hatVol:     0.020,
  },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBgMusic(active: boolean, track: MusicTrack = "quiz") {
  const ctxRef   = useRef<AudioContext | null>(null);
  const destRef  = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextRef  = useRef(0);
  const stepRef  = useRef(0);

  useEffect(() => {
    if (active) {
      try {
        const cfg   = TRACKS[track];
        const BEAT  = 60 / cfg.bpm;
        const BAR   = BEAT * 4;
        const STEP  = BEAT / 4;
        const AHEAD = 0.14;
        const LOOP  = 64; // 4 bars × 16 steps

        const schedule = () => {
          const ctx  = ctxRef.current;
          const dest = destRef.current;
          if (!ctx || !dest) return;

          while (nextRef.current < ctx.currentTime + AHEAD) {
            const t  = nextRef.current;
            const si = stepRef.current;
            const bi = Math.floor(si / 16) % 4;
            const s  = si % 16;
            const ch = cfg.chords[bi];

            // Bass
            if (cfg.bassBeats.includes(s)) {
              const isOne = s === 0;
              osc(ctx, dest, ch.bass, t,
                BEAT * (isOne ? cfg.bassLen + 0.28 : cfg.bassLen),
                isOne ? cfg.bassVol : cfg.bassVol * 0.62,
                "sine");
            }

            // Chord pad — whole bar
            if (s === 0) {
              ch.pad.forEach((f, i) =>
                osc(ctx, dest, f, t, BAR, cfg.padVol - i * cfg.padVolStep, "triangle")
              );
            }

            // Arp lead
            const ai = cfg.arp[s];
            if (ai >= 0) {
              osc(ctx, dest, ch.arp[ai], t, STEP * 0.72,
                cfg.arpVol, cfg.arpType, cfg.arpLp);
            }

            // Percussion
            if (cfg.hatBeats.includes(s) && cfg.hatVol > 0) {
              hat(ctx, dest, t, cfg.hatVol);
            }

            nextRef.current += STEP;
            stepRef.current  = (si + 1) % LOOP;
          }
        };

        const AC  = window.AudioContext ?? (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext;
        const ctx = new AC();
        if (ctx.state === "suspended") ctx.resume();

        const master = ctx.createGain();
        master.gain.setValueAtTime(0, ctx.currentTime);
        master.gain.linearRampToValueAtTime(cfg.volume, ctx.currentTime + cfg.fadeIn);
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
        if (ctxRef.current) { ctxRef.current.close().catch(() => {}); ctxRef.current = null; destRef.current = null; }
      };
    } else {
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
  }, [active, track]);
}
