import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface QuizBackgroundProps {
  emoji: string;
  category: string;
}

const PALETTE: Record<string, [string, string]> = {
  sport:         ["hsl(145,80%,42%)",  "hsl(185,70%,45%)"],
  audio:         ["hsl(280,70%,55%)",  "hsl(240,70%,60%)"],
  productivity:  ["hsl(200,80%,50%)",  "hsl(220,75%,55%)"],
  wellness:      ["hsl(160,70%,50%)",  "hsl(120,60%,45%)"],
  travel:        ["hsl(190,85%,50%)",  "hsl(215,80%,55%)"],
  tech:          ["hsl(240,75%,60%)",  "hsl(200,80%,55%)"],
  style:         ["hsl(335,80%,60%)",  "hsl(300,65%,55%)"],
  recovery:      ["hsl(260,65%,55%)",  "hsl(230,70%,55%)"],
  fitness:       ["hsl(145,80%,42%)",  "hsl(100,60%,45%)"],
  camera:        ["hsl(45,90%,55%)",   "hsl(30,85%,50%)"],
  gaming:        ["hsl(330,75%,55%)",  "hsl(280,70%,55%)"],
  communication: ["hsl(210,80%,55%)",  "hsl(185,75%,50%)"],
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
    Array.from({ length: 50 }, (_, i) => ({
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
          style={{ background: `radial-gradient(ellipse at 50% 52%, ${primary}80 0%, transparent 58%)` }}
          initial={{ opacity: 0, scale: 0.55 }}
          animate={{ opacity: [0.95, 0], scale: [0.55, 1.9] }}
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
        style={{ width: 820, height: 820, left: "-20%", top: "-8%" }}
        animate={{ x: [0, 72, -26, 72], y: [0, -58, 36, -58] }}
        transition={{
          x: { duration: 24, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 28, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{ filter: "blur(68px)" }}
          animate={{ backgroundColor: primary, opacity: [0.60, 0.76, 0.60] }}
          transition={{
            backgroundColor: COLOR_MORPH,
            opacity: { duration: 24, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </motion.div>

      {/* Orb 2 — bottom-right secondary */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 620, height: 620, right: "-12%", bottom: "-10%" }}
        animate={{ x: [0, -58, 26, -58], y: [0, -46, 56, -46] }}
        transition={{
          x: { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 },
          y: { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 },
        }}
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{ filter: "blur(62px)" }}
          animate={{ backgroundColor: secondary, opacity: [0.50, 0.66, 0.50] }}
          transition={{
            backgroundColor: COLOR_MORPH,
            opacity: { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 },
          }}
        />
      </motion.div>

      {/* Orb 3 — top-right primary */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 420, height: 420, right: "4%", top: "-14%" }}
        animate={{ x: [0, 42, -20, 42], y: [0, 46, -30, 46] }}
        transition={{
          x: { duration: 17, repeat: Infinity, ease: "easeInOut", delay: 8 },
          y: { duration: 21, repeat: Infinity, ease: "easeInOut", delay: 3 },
        }}
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{ filter: "blur(52px)" }}
          animate={{ backgroundColor: primary, opacity: [0.44, 0.58, 0.44] }}
          transition={{
            backgroundColor: COLOR_MORPH,
            opacity: { duration: 17, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </motion.div>

      {/* Orb 4 — mid-left secondary */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 300, height: 300, left: "14%", bottom: "14%" }}
        animate={{ x: [0, -32, 20, -32], y: [0, 36, -24, 36] }}
        transition={{
          x: { duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 },
          y: { duration: 19, repeat: Infinity, ease: "easeInOut", delay: 7 },
        }}
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{ filter: "blur(46px)" }}
          animate={{ backgroundColor: secondary, opacity: [0.42, 0.56, 0.42] }}
          transition={{
            backgroundColor: COLOR_MORPH,
            opacity: { duration: 15, repeat: Infinity, ease: "easeInOut", delay: 4 },
          }}
        />
      </motion.div>

      {/* Orb 5 — center ambient pulse */}
      <div
        className="absolute rounded-full"
        style={{ width: 540, height: 540, left: "calc(50% - 270px)", top: "calc(50% - 270px)" }}
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{ filter: "blur(90px)" }}
          animate={{ backgroundColor: primary, opacity: [0.20, 0.32, 0.20] }}
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
