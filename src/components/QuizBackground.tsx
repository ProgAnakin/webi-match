import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface QuizBackgroundProps {
  emoji: string;
  category: string;
}

// Each category has a distinct primary+secondary pair so the background
// shifts color clearly on every card swipe — customers notice the change.
const PALETTE: Record<string, [string, string]> = {
  sport:        ["hsl(27,92%,58%)",   "hsl(15,90%,52%)"],   // orange + red-orange
  audio:        ["hsl(27,92%,55%)",   "hsl(262,65%,62%)"],  // orange + violet
  productivity: ["hsl(40,95%,58%)",   "hsl(205,80%,58%)"],  // amber + sky
  wellness:     ["hsl(27,92%,55%)",   "hsl(340,70%,62%)"],  // orange + rose
  travel:       ["hsl(40,95%,58%)",   "hsl(195,80%,52%)"],  // amber + teal-blue
  tech:         ["hsl(27,92%,55%)",   "hsl(215,80%,62%)"],  // orange + electric blue
  style:        ["hsl(27,92%,55%)",   "hsl(315,65%,62%)"],  // orange + magenta
  recovery:     ["hsl(40,95%,58%)",   "hsl(260,60%,62%)"],  // amber + indigo
};

function sr(seed: number) {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

const QuizBackground = ({ category }: QuizBackgroundProps) => {
  const [primary, secondary] = PALETTE[category] ?? ["hsl(27,92%,55%)", "hsl(45,88%,52%)"];

  // 26 small particles — positioned in %, drift in px (small enough to look fine at any size)
  const particles = useMemo(() =>
    Array.from({ length: 26 }, (_, i) => ({
      id: i,
      x: sr(i * 7 + 1) * 100,
      y: sr(i * 7 + 2) * 100,
      size: 1.5 + sr(i * 7 + 3) * 2.8,
      dur: 7 + sr(i * 7 + 4) * 10,
      delay: sr(i * 7 + 5) * 5,
      dx: (sr(i * 7 + 6) - 0.5) * 90,
      dy: -(18 + sr(i * 7 + 7) * 75),
      isPrimary: i % 3 !== 0,
    })),
  []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      {/* ── 1. Edge vignette — always present, frames the card ─────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 75% at 50% 50%, transparent 35%, hsl(230,58%,10%)55 100%)",
        }}
      />

      {/* ── 2. Category edge glows — crossfade on card change ──────── */}
      <AnimatePresence>
        <motion.div
          key={`glows-${category}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.85, ease: "easeInOut" }}
        >
          {/* Bottom glow — primary colour bleeds up from floor */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: "42%",
              background: `radial-gradient(ellipse 100% 75% at 50% 100%, ${primary}35 0%, transparent 70%)`,
            }}
          />
          {/* Top glow — secondary colour bleeds down from ceiling */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: "32%",
              background: `radial-gradient(ellipse 90% 70% at 50% 0%, ${secondary}25 0%, transparent 70%)`,
            }}
          />
          {/* Left glow */}
          <div
            className="absolute left-0 top-0 bottom-0"
            style={{
              width: "28%",
              background: `radial-gradient(ellipse 100% 65% at 0% 42%, ${primary}22 0%, transparent 72%)`,
            }}
          />
          {/* Right glow */}
          <div
            className="absolute right-0 top-0 bottom-0"
            style={{
              width: "28%",
              background: `radial-gradient(ellipse 100% 65% at 100% 58%, ${secondary}18 0%, transparent 72%)`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── 3. Pulsing edge strips — live breathing effect ─────────── */}
      <motion.div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: "10%",
          background: `linear-gradient(to right, ${primary}28, transparent)`,
        }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 top-0 bottom-0"
        style={{
          width: "10%",
          background: `linear-gradient(to left, ${secondary}22, transparent)`,
        }}
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
      />

      {/* ── 4. Diagonal shimmer sweep — catches the eye every ~8 s ─── */}
      <motion.div
        className="absolute"
        style={{
          width: "3px",
          height: "220%",
          top: "-60%",
          background: `linear-gradient(to bottom, transparent 0%, ${primary}55 45%, ${secondary}55 55%, transparent 100%)`,
          filter: "blur(6px)",
          transform: "rotate(28deg)",
          transformOrigin: "top center",
        }}
        animate={{ left: ["-8%", "115%"] }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          repeatDelay: 6.5,
          ease: [0.4, 0, 0.6, 1],
        }}
      />

      {/* ── 5. Particle field — crossfades per category ────────────── */}
      <AnimatePresence>
        <motion.div
          key={`pts-${category}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeInOut" }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                backgroundColor: p.isPrimary ? primary : secondary,
              }}
              animate={{
                x:       [0, p.dx * 0.3, p.dx, p.dx * 0.55, 0],
                y:       [0, p.dy * 0.25, p.dy, p.dy * 0.6,  0],
                opacity: [0, 0.9, 1.0, 0.65, 0],
                scale:   [0.4, 1.2, 1.7, 0.85, 0.4],
              }}
              transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* ── 6. Card-change burst flash — instant energy on swipe ────── */}
      <AnimatePresence>
        <motion.div
          key={`burst-${category}`}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 52%, ${primary}60 0%, transparent 55%)`,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0.6, 0], scale: [0.5, 2.0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </AnimatePresence>

      {/* ── 7. SVG fractal grain — subtle texture ───────────────────── */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.055]" xmlns="http://www.w3.org/2000/svg">
        <filter id="qbg-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#qbg-grain)" />
      </svg>
    </div>
  );
};

export default QuizBackground;
