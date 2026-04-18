import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface QuizBackgroundProps {
  emoji: string;
  category: string;
}

// Primary + complementary color pairs per category
const PALETTE: Record<string, [string, string]> = {
  sport:        ["hsl(145,80%,42%)",  "hsl(185,70%,45%)"],
  audio:        ["hsl(280,70%,55%)",  "hsl(240,70%,60%)"],
  productivity: ["hsl(200,80%,50%)",  "hsl(220,75%,55%)"],
  wellness:     ["hsl(160,70%,50%)",  "hsl(120,60%,45%)"],
  travel:       ["hsl(190,85%,50%)",  "hsl(215,80%,55%)"],
  tech:         ["hsl(240,75%,60%)",  "hsl(200,80%,55%)"],
  style:        ["hsl(335,80%,60%)",  "hsl(300,65%,55%)"],
  recovery:     ["hsl(260,65%,55%)",  "hsl(230,70%,55%)"],
  fitness:      ["hsl(145,80%,42%)",  "hsl(100,60%,45%)"],
  camera:       ["hsl(45,90%,55%)",   "hsl(30,85%,50%)"],
  gaming:       ["hsl(330,75%,55%)",  "hsl(280,70%,55%)"],
  communication:["hsl(210,80%,55%)",  "hsl(185,75%,50%)"],
};

function sr(seed: number) {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

const QuizBackground = ({ category }: QuizBackgroundProps) => {
  const [primary, secondary] = PALETTE[category] ?? ["hsl(27,92%,55%)", "hsl(45,88%,52%)"];

  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: sr(i * 7 + 1) * 100,
      y: sr(i * 7 + 2) * 100,
      size: 2.5 + sr(i * 7 + 3) * 4,
      dur: 9 + sr(i * 7 + 4) * 12,
      delay: sr(i * 7 + 5) * 7,
      dx: (sr(i * 7 + 6) - 0.5) * 90,
      dy: -(35 + sr(i * 7 + 7) * 95),
      color: i % 3 === 0 ? "secondary" : "primary",
    })),
  []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      {/* ── Orb 1 — hero, large, left-center ─────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`o1-${category}`}
          className="absolute rounded-full"
          style={{
            width: 720, height: 720,
            left: "-18%", top: "0%",
            background: `radial-gradient(circle, ${primary} 0%, transparent 58%)`,
            filter: "blur(80px)",
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.34, 0.46, 0.34],
            x: [0, 70, -25, 70],
            y: [0, -55, 35, -55],
          }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          transition={{
            opacity: { duration: 0.9 },
            x: { duration: 24, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 28, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </AnimatePresence>

      {/* ── Orb 2 — medium, secondary, bottom-right ───────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`o2-${category}`}
          className="absolute rounded-full"
          style={{
            width: 520, height: 520,
            right: "-10%", bottom: "-5%",
            background: `radial-gradient(circle, ${secondary} 0%, transparent 58%)`,
            filter: "blur(72px)",
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.26, 0.38, 0.26],
            x: [0, -55, 25, -55],
            y: [0, -45, 55, -45],
          }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          transition={{
            opacity: { duration: 1.1 },
            x: { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 },
            y: { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 },
          }}
        />
      </AnimatePresence>

      {/* ── Orb 3 — small primary, top-right ──────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`o3-${category}`}
          className="absolute rounded-full"
          style={{
            width: 340, height: 340,
            right: "8%", top: "-10%",
            background: `radial-gradient(circle, ${primary} 0%, transparent 58%)`,
            filter: "blur(62px)",
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.24, 0.34, 0.24],
            x: [0, 40, -18, 40],
            y: [0, 45, -28, 45],
          }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          transition={{
            opacity: { duration: 1.0 },
            x: { duration: 17, repeat: Infinity, ease: "easeInOut", delay: 8 },
            y: { duration: 21, repeat: Infinity, ease: "easeInOut", delay: 3 },
          }}
        />
      </AnimatePresence>

      {/* ── Orb 4 — tiny secondary accent, mid-left ───────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`o4-${category}`}
          className="absolute rounded-full"
          style={{
            width: 220, height: 220,
            left: "18%", bottom: "18%",
            background: `radial-gradient(circle, ${secondary} 0%, transparent 58%)`,
            filter: "blur(52px)",
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.22, 0.32, 0.22],
            x: [0, -30, 18, -30],
            y: [0, 35, -22, 35],
          }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          transition={{
            opacity: { duration: 1.2 },
            x: { duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 },
            y: { duration: 19, repeat: Infinity, ease: "easeInOut", delay: 7 },
          }}
        />
      </AnimatePresence>

      {/* ── Particle field — tiny data dots ───────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`pts-${category}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
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
                background: p.color === "secondary" ? secondary : primary,
              }}
              animate={{
                x:       [0, p.dx * 0.3, p.dx, p.dx * 0.6, 0],
                y:       [0, p.dy * 0.28, p.dy, p.dy * 0.65, 0],
                opacity: [0, 0.70, 0.92, 0.55, 0],
                scale:   [0.4, 1.0, 1.35, 0.75, 0.4],
              }}
              transition={{
                duration: p.dur,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* ── Diagonal light-beam sweep (periodic) ──────────────────── */}
      <motion.div
        className="absolute top-0 bottom-0 left-0"
        style={{
          width: "35%",
          background: `linear-gradient(to right, transparent, ${primary}30 50%, transparent)`,
          skewX: "-18deg",
        }}
        animate={{ x: ["-35vw", "170vw"] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 6,
        }}
      />

      {/* ── SVG fractal noise grain — adds premium depth ──────────── */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.05]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="qbg-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.68"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#qbg-grain)" />
      </svg>
    </div>
  );
};

export default QuizBackground;
