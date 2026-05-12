import { motion } from "framer-motion";
import { memo } from "react";

// ── Star constellation ─────────────────────────────────────────────────────
// Deterministic positions (no random) so the layout is stable across renders.
// Tints rotate between white, Webidoo orange and amber for brand coherence.
interface Star { left: string; top: string; size: number; delay: number; dur: number; tint: string; }
const STARS: Star[] = Array.from({ length: 46 }, (_, i) => {
  const tint =
    i % 6 === 0 ? "hsla(27, 92%, 70%, 0.95)" :   // brand orange
    i % 9 === 0 ? "hsla(38, 96%, 70%, 0.95)" :   // amber
                  "hsla(0, 0%, 100%, 0.9)";       // white
  return {
    left:  `${(i * 73 + 5) % 96}%`,
    top:   `${(i * 41 + 3) % 94}%`,
    size:  1.2 + (i % 4) * 0.7,
    delay: (i * 0.31) % 9,
    dur:   2.4 + (i % 5) * 0.9,
    tint,
  };
});

// ── Ember Float (kept — already polished) ─────────────────────────────────
interface Ember { top: number; dur: number; delay: string; w: number; h: number; color: string; anim: string; }
const EMBERS: Ember[] = [
  // Left wall → travel right
  { top: 16, dur: 6.2, delay: "-1.5s",  w: 4, h: 4, color: "#fb6b04", anim: "wb-ember-ltr"   },
  { top: 25, dur: 5.5, delay: "-4.2s",  w: 7, h: 2, color: "#f8a432", anim: "wb-ember-ltr-b" },
  { top: 36, dur: 7.1, delay: "-7.8s",  w: 3, h: 3, color: "#fcb498", anim: "wb-ember-ltr"   },
  { top: 47, dur: 5.8, delay: "-2.1s",  w: 5, h: 5, color: "#fb6b04", anim: "wb-ember-ltr-b" },
  { top: 57, dur: 6.8, delay: "-9.3s",  w: 6, h: 2, color: "#f8a432", anim: "wb-ember-ltr"   },
  { top: 68, dur: 5.3, delay: "-5.7s",  w: 2, h: 2, color: "#fb6b04", anim: "wb-ember-ltr-b" },
  { top: 78, dur: 7.4, delay: "-3.6s",  w: 3, h: 3, color: "#fcb498", anim: "wb-ember-ltr"   },
  { top: 21, dur: 6.0, delay: "-8.0s",  w: 7, h: 2, color: "#fb6b04", anim: "wb-ember-ltr-b" },
  { top: 42, dur: 7.6, delay: "-0.8s",  w: 2, h: 2, color: "#f8a432", anim: "wb-ember-ltr"   },
  { top: 62, dur: 5.1, delay: "-6.4s",  w: 4, h: 4, color: "#fcb498", anim: "wb-ember-ltr-b" },
  { top: 72, dur: 6.7, delay: "-10.2s", w: 5, h: 2, color: "#fb6b04", anim: "wb-ember-ltr"   },
  { top: 32, dur: 5.9, delay: "-11.5s", w: 6, h: 2, color: "#f8a432", anim: "wb-ember-ltr-b" },
  // Right wall → travel left
  { top: 18, dur: 6.4, delay: "-3.2s",  w: 3, h: 3, color: "#f8a432", anim: "wb-ember-rtl"   },
  { top: 28, dur: 5.7, delay: "-7.0s",  w: 6, h: 2, color: "#fb6b04", anim: "wb-ember-rtl-b" },
  { top: 40, dur: 7.2, delay: "-1.4s",  w: 4, h: 4, color: "#fcb498", anim: "wb-ember-rtl"   },
  { top: 51, dur: 5.6, delay: "-9.1s",  w: 2, h: 2, color: "#fb6b04", anim: "wb-ember-rtl-b" },
  { top: 61, dur: 6.9, delay: "-4.5s",  w: 7, h: 2, color: "#f8a432", anim: "wb-ember-rtl"   },
  { top: 74, dur: 5.2, delay: "-6.8s",  w: 3, h: 3, color: "#fcb498", anim: "wb-ember-rtl-b" },
  { top: 83, dur: 7.7, delay: "-2.3s",  w: 4, h: 2, color: "#fb6b04", anim: "wb-ember-rtl"   },
  { top: 23, dur: 6.1, delay: "-8.6s",  w: 2, h: 2, color: "#f8a432", anim: "wb-ember-rtl-b" },
  { top: 45, dur: 7.5, delay: "-0.5s",  w: 5, h: 5, color: "#fb6b04", anim: "wb-ember-rtl"   },
  { top: 64, dur: 5.4, delay: "-5.1s",  w: 3, h: 2, color: "#fcb498", anim: "wb-ember-rtl-b" },
  { top: 76, dur: 6.6, delay: "-10.7s", w: 4, h: 4, color: "#fb6b04", anim: "wb-ember-rtl"   },
  { top: 35, dur: 5.8, delay: "-12.0s", w: 6, h: 2, color: "#f8a432", anim: "wb-ember-rtl-b" },
];

// Radial-gradient orbs (no filter:blur — Safari iPad-safe).
// `closest-side` keeps the falloff perfectly circular regardless of element shape.
const OrbGradient = ({ hue, sat, lit }: { hue: number; sat: number; lit: number }) =>
  `radial-gradient(circle closest-side, hsla(${hue},${sat}%,${lit}%,0.55) 0%, hsla(${hue},${sat}%,${lit}%,0.18) 38%, transparent 72%)`;

const QuizBackground = memo(() => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">

    {/* ── Layer 1 · Deep cosmic gradient ─────────────────────────────────────── */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 120% 90% at 50% 30%, hsl(230, 55%, 22%) 0%, hsl(230, 60%, 12%) 60%, hsl(230, 65%, 8%) 100%)",
      }}
    />

    {/* ── Layer 2 · Ambient aurora orbs (no filter:blur for iOS Safari) ───── */}
    <motion.div
      className="absolute"
      style={{
        left: "-14vw", top: "-8vh",
        width: "max(620px, 56vmin)", height: "max(620px, 56vmin)",
        background: OrbGradient({ hue: 27, sat: 92, lit: 56 }),
        willChange: "transform",
      }}
      animate={{
        x: [0, 60, 30, -20, 0],
        y: [0, 35, -25, 50, 0],
        scale: [1, 1.12, 0.94, 1.06, 1],
      }}
      transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute"
      style={{
        right: "-16vw", top: "12vh",
        width: "max(540px, 50vmin)", height: "max(540px, 50vmin)",
        background: OrbGradient({ hue: 16, sat: 100, lit: 52 }),
        willChange: "transform",
      }}
      animate={{
        x: [0, -50, 20, -30, 0],
        y: [0, 45, -20, 35, 0],
        scale: [1, 0.92, 1.10, 0.96, 1],
      }}
      transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute"
      style={{
        left: "20vw", bottom: "-18vh",
        width: "max(560px, 52vmin)", height: "max(560px, 52vmin)",
        background: OrbGradient({ hue: 230, sat: 75, lit: 48 }),
        willChange: "transform",
      }}
      animate={{
        x: [0, 40, -25, 30, 0],
        y: [0, -30, 25, -40, 0],
        scale: [1, 1.06, 0.94, 1.08, 1],
      }}
      transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* ── Layer 3 · Diagonal light sweep (slow comet) ────────────────────── */}
    <motion.div
      className="absolute"
      style={{
        left: "-30%", top: "-20%",
        width: "60%", height: "140%",
        background:
          "linear-gradient(110deg, transparent 35%, hsla(27, 92%, 70%, 0.06) 48%, hsla(27, 92%, 80%, 0.12) 50%, hsla(27, 92%, 70%, 0.06) 52%, transparent 65%)",
        willChange: "transform",
      }}
      animate={{ x: ["0vw", "180vw"] }}
      transition={{ duration: 22, repeat: Infinity, ease: "linear", repeatDelay: 8 }}
    />

    {/* ── Layer 4 · Star constellation ──────────────────────────────────── */}
    {STARS.map((s, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          left: s.left, top: s.top,
          width: s.size, height: s.size,
          background: s.tint,
          boxShadow: `0 0 ${s.size * 3}px ${s.tint}`,
          willChange: "opacity, transform",
        }}
        animate={{ opacity: [0.15, 1, 0.15], scale: [0.7, 1.3, 0.7] }}
        transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
      />
    ))}

    {/* ── Layer 5 · Ember Float — sparks from side walls ─────────────────── */}
    {EMBERS.map((e, i) => {
      const fromLeft = e.anim.startsWith("wb-ember-ltr");
      return (
        <div
          key={i}
          style={{
            position:     "absolute",
            top:          `${e.top}%`,
            [fromLeft ? "left" : "right"]: -8,
            width:        e.w,
            height:       e.h,
            borderRadius: e.w === e.h ? "50%" : 2,
            background:   e.color,
            boxShadow:    `0 0 ${Math.max(e.w, e.h) * 2}px ${e.color}80`,
            animation:    `${e.anim} ${e.dur}s ease-out ${e.delay} infinite`,
            willChange:   "transform, opacity",
          }}
        />
      );
    })}

    {/* ── Layer 6 · Edge vignette (focus pull toward centre) ─────────────── */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 95% 90% at 50% 50%, transparent 38%, hsla(230, 65%, 6%, 0.65) 100%)",
      }}
    />

    {/* ── Layer 7 · Subtle grain noise (premium feel) ────────────────────── */}
    <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.025]">
      <filter id="qb-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#qb-grain)" />
    </svg>
  </div>
));

export default QuizBackground;
