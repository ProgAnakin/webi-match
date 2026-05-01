import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface QuizBackgroundProps {
  emoji: string;
  category: string;
}

// Brand-anchored palette: PRIMARY is always brand orange/amber (Webidoo identity),
// SECONDARY adds gentle category accent without breaking the warm visual DNA.
const PALETTE: Record<string, [string, string]> = {
  sport:         ["hsl(27,92%,55%)",  "hsl(15,88%,58%)"],   // orange + orange-red
  audio:         ["hsl(27,92%,55%)",  "hsl(270,55%,58%)"],  // orange + warm violet
  productivity:  ["hsl(40,95%,58%)",  "hsl(210,55%,55%)"],  // amber + sky
  wellness:      ["hsl(27,92%,55%)",  "hsl(340,65%,62%)"],  // orange + warm rose
  travel:        ["hsl(40,95%,58%)",  "hsl(200,65%,55%)"],  // amber + sky blue
  tech:          ["hsl(27,92%,55%)",  "hsl(220,70%,60%)"],  // orange + electric blue
  style:         ["hsl(27,92%,55%)",  "hsl(320,60%,60%)"],  // orange + magenta-coral
  recovery:      ["hsl(40,95%,58%)",  "hsl(265,55%,58%)"],  // amber + soft violet
};

// Duration for color morphing between categories
const COLOR_MORPH = { duration: 1.1, ease: "easeInOut" } as const;

function sr(seed: number) {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

const QuizBackground = ({ category }: QuizBackgroundProps) => {
  const [primary, secondary] = PALETTE[category] ?? ["hsl(27,92%,55%)", "hsl(45,88%,52%)"];

  const particles = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: sr(i * 7 + 1) * 100,
      y: sr(i * 7 + 2) * 100,
      size: 3 + sr(i * 7 + 3) * 5.5,
      dur: 6 + sr(i * 7 + 4) * 9,
      delay: sr(i * 7 + 5) * 3.5,
      dx: (sr(i * 7 + 6) - 0.5) * 120,
      dy: -(40 + sr(i * 7 + 7) * 105),
      isPrimary: i % 3 !== 0,
    })),
  []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      {/* ── Burst flash — fires instantly on card change ─────────── */}
      <AnimatePresence>
        <motion.div
          key={`burst-${category}`}
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 50% 52%, ${primary}55 0%, transparent 58%)` }}
          initial={{ opacity: 0, scale: 0.55 }}
          animate={{ opacity: [0.55, 0], scale: [0.55, 1.9] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        />
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          Orbs — outer div owns the floating movement (never changes),
          inner div owns backgroundColor which Framer morphs smoothly.
         ══════════════════════════════════════════════════════════ */}

      {/* Orb 1 — hero, left */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: "min(820px, 85vmin)", height: "min(820px, 85vmin)", left: "-20%", top: "-8%" }}
        animate={{ x: [0, 72, -26, 72], y: [0, -58, 36, -58] }}
        transition={{
          x: { duration: 24, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 28, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{ filter: "blur(clamp(40px, 7vmin, 68px))" }}
          animate={{ backgroundColor: primary, opacity: [0.28, 0.38, 0.28] }}
          transition={{
            backgroundColor: COLOR_MORPH,
            opacity: { duration: 24, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </motion.div>

      {/* Orb 2 — bottom-right secondary */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: "min(620px, 65vmin)", height: "min(620px, 65vmin)", right: "-12%", bottom: "-10%" }}
        animate={{ x: [0, -58, 26, -58], y: [0, -46, 56, -46] }}
        transition={{
          x: { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 },
          y: { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 },
        }}
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{ filter: "blur(clamp(36px, 6vmin, 62px))" }}
          animate={{ backgroundColor: secondary, opacity: [0.22, 0.32, 0.22] }}
          transition={{
            backgroundColor: COLOR_MORPH,
            opacity: { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 },
          }}
        />
      </motion.div>

      {/* Orb 3 — top-right primary */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: "min(420px, 44vmin)", height: "min(420px, 44vmin)", right: "4%", top: "-14%" }}
        animate={{ x: [0, 42, -20, 42], y: [0, 46, -30, 46] }}
        transition={{
          x: { duration: 17, repeat: Infinity, ease: "easeInOut", delay: 8 },
          y: { duration: 21, repeat: Infinity, ease: "easeInOut", delay: 3 },
        }}
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{ filter: "blur(clamp(28px, 5vmin, 52px))" }}
          animate={{ backgroundColor: primary, opacity: [0.18, 0.28, 0.18] }}
          transition={{
            backgroundColor: COLOR_MORPH,
            opacity: { duration: 17, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </motion.div>

      {/* Orb 4 — mid-left secondary */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: "min(300px, 32vmin)", height: "min(300px, 32vmin)", left: "14%", bottom: "14%" }}
        animate={{ x: [0, -32, 20, -32], y: [0, 36, -24, 36] }}
        transition={{
          x: { duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 },
          y: { duration: 19, repeat: Infinity, ease: "easeInOut", delay: 7 },
        }}
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{ filter: "blur(clamp(24px, 4.5vmin, 46px))" }}
          animate={{ backgroundColor: secondary, opacity: [0.18, 0.26, 0.18] }}
          transition={{
            backgroundColor: COLOR_MORPH,
            opacity: { duration: 15, repeat: Infinity, ease: "easeInOut", delay: 4 },
          }}
        />
      </motion.div>

      {/* Orb 5 — center ambient pulse */}
      <div
        className="absolute rounded-full"
        style={{
          width: "min(540px, 56vmin)",
          height: "min(540px, 56vmin)",
          left: "calc(50% - min(270px, 28vmin))",
          top: "calc(50% - min(270px, 28vmin))",
        }}
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{ filter: "blur(clamp(50px, 9vmin, 90px))" }}
          animate={{ backgroundColor: primary, opacity: [0.08, 0.15, 0.08] }}
          transition={{
            backgroundColor: COLOR_MORPH,
            opacity: { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </div>

      {/* ── Particle field — cross-fades on change (50 particles) ─── */}
      <AnimatePresence>
        <motion.div
          key={`pts-${category}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
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
                x:       [0, p.dx * 0.3, p.dx, p.dx * 0.6, 0],
                y:       [0, p.dy * 0.28, p.dy, p.dy * 0.65, 0],
                opacity: [0, 0.88, 1.0, 0.68, 0],
                scale:   [0.5, 1.1, 1.55, 0.9, 0.5],
              }}
              transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* ── SVG fractal grain ─────────────────────────────────────── */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
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
