import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface QuizBackgroundProps {
  emoji: string;
  category: string;
}

const PALETTE: Record<string, [string, string]> = {
  sport:        ["hsl(27,92%,60%)",   "hsl(12,90%,54%)"],
  audio:        ["hsl(27,92%,58%)",   "hsl(260,70%,64%)"],
  productivity: ["hsl(42,98%,60%)",   "hsl(205,85%,60%)"],
  wellness:     ["hsl(27,92%,58%)",   "hsl(145,75%,48%)"],
  travel:       ["hsl(42,98%,60%)",   "hsl(192,85%,54%)"],
  tech:         ["hsl(27,92%,58%)",   "hsl(215,85%,64%)"],
  style:        ["hsl(27,92%,58%)",   "hsl(315,68%,64%)"],
  recovery:     ["hsl(42,98%,60%)",   "hsl(258,62%,64%)"],
};

// Smooth per-property color transition — shared by all aurora layers
const C = { duration: 0.95, ease: "easeInOut" } as const;

function sr(seed: number) {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

const QuizBackground = ({ category }: QuizBackgroundProps) => {
  const [primary, secondary] = PALETTE[category] ?? ["hsl(27,92%,58%)", "hsl(45,90%,55%)"];

  // Stable seeds — particles never remount, only colors morph
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: sr(i * 7 + 1) * 100,
      y: sr(i * 7 + 2) * 100,
      size: 2.5 + sr(i * 7 + 3) * 3,
      dur: 9 + sr(i * 7 + 4) * 11,
      delay: sr(i * 7 + 5) * 6,
      dx: (sr(i * 7 + 6) - 0.5) * 100,
      dy: -(25 + sr(i * 7 + 7) * 80),
      isPrimary: i % 3 !== 0,
    })),
  []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      {/* ════════════════════════════════════════════════════════
          AURORA — 4 persistent bands. Movement never stops.
          Color morphs smoothly when category changes.
          No key prop = no unmount/remount on card swipe.
         ════════════════════════════════════════════════════════ */}

      {/* TOP aurora — wide band bleeding from ceiling */}
      <motion.div
        className="absolute"
        style={{ left: "-10%", top: "-25%", width: "120%", height: "58%", borderRadius: "0 0 55% 55%" }}
        animate={{ y: [0, 22, -10, 22, 0], scaleX: [1, 1.05, 0.96, 1.05, 1] }}
        transition={{
          y:      { duration: 22, repeat: Infinity, ease: "easeInOut" },
          scaleX: { duration: 30, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <motion.div
          className="h-full w-full"
          style={{ borderRadius: "inherit", filter: "blur(52px)", opacity: 0.40 }}
          animate={{ backgroundColor: primary }}
          transition={C}
        />
      </motion.div>

      {/* BOTTOM aurora — mirrors top */}
      <motion.div
        className="absolute"
        style={{ left: "-10%", bottom: "-25%", width: "120%", height: "52%", borderRadius: "55% 55% 0 0" }}
        animate={{ y: [0, -18, 10, -18, 0], scaleX: [1, 0.96, 1.06, 0.96, 1] }}
        transition={{
          y:      { duration: 19, repeat: Infinity, ease: "easeInOut", delay: 4 },
          scaleX: { duration: 26, repeat: Infinity, ease: "easeInOut", delay: 2 },
        }}
      >
        <motion.div
          className="h-full w-full"
          style={{ borderRadius: "inherit", filter: "blur(48px)", opacity: 0.36 }}
          animate={{ backgroundColor: primary }}
          transition={C}
        />
      </motion.div>

      {/* LEFT aurora — secondary color, side accent */}
      <motion.div
        className="absolute"
        style={{ left: "-22%", top: "12%", width: "48%", height: "76%", borderRadius: "0 45% 45% 0" }}
        animate={{ x: [0, 18, -6, 18, 0], scaleY: [1, 1.07, 0.94, 1.07, 1] }}
        transition={{
          x:      { duration: 17, repeat: Infinity, ease: "easeInOut", delay: 1 },
          scaleY: { duration: 21, repeat: Infinity, ease: "easeInOut", delay: 6 },
        }}
      >
        <motion.div
          className="h-full w-full"
          style={{ borderRadius: "inherit", filter: "blur(46px)", opacity: 0.30 }}
          animate={{ backgroundColor: secondary }}
          transition={C}
        />
      </motion.div>

      {/* RIGHT aurora — secondary color, side accent */}
      <motion.div
        className="absolute"
        style={{ right: "-22%", top: "18%", width: "44%", height: "64%", borderRadius: "45% 0 0 45%" }}
        animate={{ x: [0, -15, 7, -15, 0], scaleY: [1, 0.93, 1.08, 0.93, 1] }}
        transition={{
          x:      { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 8 },
          scaleY: { duration: 24, repeat: Infinity, ease: "easeInOut", delay: 3 },
        }}
      >
        <motion.div
          className="h-full w-full"
          style={{ borderRadius: "inherit", filter: "blur(44px)", opacity: 0.26 }}
          animate={{ backgroundColor: secondary }}
          transition={C}
        />
      </motion.div>

      {/* CENTER vignette — dark ring keeps the card readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 68% 62% at 50% 52%, transparent 18%, hsl(230,58%,11%)55 78%)",
        }}
      />

      {/* ════════════════════════════════════════════════════════
          PARTICLES — stable keys, color morphs via animate prop.
          The x/y/opacity/scale animation loops forever; when
          the category changes, backgroundColor interpolates
          to the new value without interrupting the loop.
         ════════════════════════════════════════════════════════ */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            x:               [0, p.dx * 0.3, p.dx, p.dx * 0.55, 0],
            y:               [0, p.dy * 0.25, p.dy, p.dy * 0.6, 0],
            opacity:         [0, 0.95, 1, 0.65, 0],
            scale:           [0.3, 1.3, 1.8, 0.9, 0.3],
            backgroundColor: p.isPrimary ? primary : secondary,
          }}
          transition={{
            x:               { duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" },
            y:               { duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" },
            opacity:         { duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" },
            scale:           { duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" },
            backgroundColor: { duration: 0.85, ease: "easeInOut" },
          }}
        />
      ))}

      {/* ════════════════════════════════════════════════════════
          BURST FLASH — the ONE element that fires on each swipe.
          Gives instant visual feedback that the card changed.
         ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        <motion.div
          key={`burst-${category}`}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 52%, ${primary}65 0%, transparent 52%)`,
          }}
          initial={{ opacity: 0, scale: 0.45 }}
          animate={{ opacity: [0.7, 0], scale: [0.45, 2.2] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
        />
      </AnimatePresence>

      {/* GRAIN — subtle texture over everything */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
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
