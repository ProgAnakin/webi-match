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

const ENTER = { duration: 0.22, ease: "easeOut" };
const EXIT  = { duration: 0.18, ease: "easeIn"  };

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
      color: i % 3 === 0 ? "secondary" : "primary",
    })),
  []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      {/* ── Burst flash — fires the instant category changes ───────── */}
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

      {/* ── Orb 1 — hero, left ────────────────────────────────────── */}
      <AnimatePresence>
        <motion.div
          key={`o1-${category}`}
          className="absolute rounded-full"
          style={{
            width: 820, height: 820,
            left: "-20%", top: "-8%",
            background: `radial-gradient(circle, ${primary} 0%, transparent 60%)`,
            filter: "blur(68px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.60, 0.76, 0.60], x: [0, 72, -26, 72], y: [0, -58, 36, -58] }}
          exit={{ opacity: 0, transition: EXIT }}
          transition={{
            opacity: { ...ENTER },
            x: { duration: 24, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 28, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </AnimatePresence>

      {/* ── Orb 2 — bottom-right secondary ───────────────────────── */}
      <AnimatePresence>
        <motion.div
          key={`o2-${category}`}
          className="absolute rounded-full"
          style={{
            width: 620, height: 620,
            right: "-12%", bottom: "-10%",
            background: `radial-gradient(circle, ${secondary} 0%, transparent 60%)`,
            filter: "blur(62px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.50, 0.66, 0.50], x: [0, -58, 26, -58], y: [0, -46, 56, -46] }}
          exit={{ opacity: 0, transition: EXIT }}
          transition={{
            opacity: { ...ENTER },
            x: { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 },
            y: { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 },
          }}
        />
      </AnimatePresence>

      {/* ── Orb 3 — top-right primary ────────────────────────────── */}
      <AnimatePresence>
        <motion.div
          key={`o3-${category}`}
          className="absolute rounded-full"
          style={{
            width: 420, height: 420,
            right: "4%", top: "-14%",
            background: `radial-gradient(circle, ${primary} 0%, transparent 60%)`,
            filter: "blur(52px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.45, 0.60, 0.45], x: [0, 42, -20, 42], y: [0, 46, -30, 46] }}
          exit={{ opacity: 0, transition: EXIT }}
          transition={{
            opacity: { ...ENTER },
            x: { duration: 17, repeat: Infinity, ease: "easeInOut", delay: 8 },
            y: { duration: 21, repeat: Infinity, ease: "easeInOut", delay: 3 },
          }}
        />
      </AnimatePresence>

      {/* ── Orb 4 — mid-left secondary ────────────────────────────── */}
      <AnimatePresence>
        <motion.div
          key={`o4-${category}`}
          className="absolute rounded-full"
          style={{
            width: 300, height: 300,
            left: "14%", bottom: "14%",
            background: `radial-gradient(circle, ${secondary} 0%, transparent 60%)`,
            filter: "blur(46px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.42, 0.56, 0.42], x: [0, -32, 20, -32], y: [0, 36, -24, 36] }}
          exit={{ opacity: 0, transition: EXIT }}
          transition={{
            opacity: { ...ENTER },
            x: { duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 },
            y: { duration: 19, repeat: Infinity, ease: "easeInOut", delay: 7 },
          }}
        />
      </AnimatePresence>

      {/* ── Orb 5 — center ambient pulse ──────────────────────────── */}
      <AnimatePresence>
        <motion.div
          key={`o5-${category}`}
          className="absolute rounded-full"
          style={{
            width: 540, height: 540,
            left: "calc(50% - 270px)", top: "calc(50% - 270px)",
            background: `radial-gradient(circle, ${primary} 0%, transparent 55%)`,
            filter: "blur(90px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.22, 0.34, 0.22] }}
          exit={{ opacity: 0, transition: EXIT }}
          transition={{
            opacity: { ...ENTER, duration: 3.8, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </AnimatePresence>

      {/* ── Particle field ────────────────────────────────────────── */}
      <AnimatePresence>
        <motion.div
          key={`pts-${category}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={ENTER}
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
                opacity: [0, 0.88, 1.0, 0.68, 0],
                scale:   [0.5, 1.1, 1.55, 0.9, 0.5],
              }}
              transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* ── Light sweep 1 — primary, every ~7.5s ──────────────────── */}
      <motion.div
        className="absolute top-0 bottom-0 left-0"
        style={{
          width: "42%",
          background: `linear-gradient(to right, transparent, ${primary}55 50%, transparent)`,
          skewX: "-18deg",
        }}
        animate={{ x: ["-42vw", "180vw"] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 3.5 }}
      />

      {/* ── Light sweep 2 — secondary, offset ─────────────────────── */}
      <motion.div
        className="absolute top-0 bottom-0 left-0"
        style={{
          width: "22%",
          background: `linear-gradient(to right, transparent, ${secondary}42 50%, transparent)`,
          skewX: "-13deg",
        }}
        animate={{ x: ["-22vw", "180vw"] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 2.2, repeatDelay: 5 }}
      />

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
