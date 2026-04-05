import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Quiz background: category-themed SVG silhouettes floating around the card.
 * No emojis — pure stroke-only icons, same visual language as DiscoveryBackground.
 *
 * Central orb cross-fades between category colours via Framer Motion.
 * Floating icons and expanding rings are driven by pure CSS @keyframes (index.css):
 *   qb-float-a / qb-float-b / qb-float-c — vertical/horizontal drift + opacity pulse
 *   qb-ring                               — expanding border circle from centre
 */

interface IconDef {
  path: string;
  x: number;    // % from left
  y: number;    // % from top
  size: number; // base px size (scales up via max/vmin on larger screens)
  delay: string;
  dur: number;
  anim: "qb-float-a" | "qb-float-b" | "qb-float-c";
}

interface CategoryStyle {
  color: string; // hsla for stroke & orb centre
  icons: IconDef[];
}

const DATA: Record<string, CategoryStyle> = {
  fitness: {
    color: "hsla(145,80%,55%,1)",
    icons: [
      // Dumbbell
      { path: "M6 24h36 M6 18v12 M10 16v16 M38 16v16 M42 18v12",
        x: 5,  y: 8,  size: 48, delay: "-2s", dur: 6, anim: "qb-float-a" },
      // Heart-rate monitor
      { path: "M4 24h8l5-12 6 22 5-14 6 4h10",
        x: 70, y: 14, size: 44, delay: "-4s", dur: 7, anim: "qb-float-b" },
      // Lightning / energy bolt
      { path: "M28 4L14 26h14L20 44 36 20H22Z",
        x: 8,  y: 70, size: 40, delay: "-1s", dur: 5, anim: "qb-float-c" },
      // Trophy cup
      { path: "M16 6h16v14a8 8 0 0 1-16 0V6z M12 6h24 M24 28v8 M18 36h12 M12 40h24",
        x: 76, y: 66, size: 44, delay: "-6s", dur: 8, anim: "qb-float-a" },
    ],
  },

  audio: {
    color: "hsla(280,70%,65%,1)",
    icons: [
      // Headphones
      { path: "M9 26V19a15 15 0 0 1 30 0v7 M9 22v12a4 4 0 0 0 4 4h2V22H9z M39 22v16h-2a4 4 0 0 1-4-4V22h6z",
        x: 5,  y: 9,  size: 48, delay: "-3s", dur: 7, anim: "qb-float-b" },
      // Double music note
      { path: "M20 36V16l20-4v24 M20 36a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M40 32a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
        x: 68, y: 8,  size: 46, delay: "-6s", dur: 9, anim: "qb-float-a" },
      // Vertical waveform bars
      { path: "M4 24v-6 M10 24V10 M16 24V14 M22 24V6 M28 24V14 M34 24V10 M40 24V18 M46 24v-6",
        x: 7,  y: 68, size: 44, delay: "-1s", dur: 6, anim: "qb-float-c" },
      // Speaker with sound waves
      { path: "M6 18h8l10-8v28l-10-8H6V18z M28 16a10 10 0 0 1 0 16 M32 12a16 16 0 0 1 0 24",
        x: 74, y: 64, size: 48, delay: "-8s", dur: 8, anim: "qb-float-b" },
    ],
  },

  productivity: {
    color: "hsla(200,80%,55%,1)",
    icons: [
      // Laptop
      { path: "M6 30V14a2 2 0 0 1 2-2h32a2 2 0 0 1 2 2v16H6z M2 30h44v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2z M19 30v3h10v-3",
        x: 4,  y: 8,  size: 48, delay: "-2s", dur: 8, anim: "qb-float-a" },
      // Clock
      { path: "M24 6a18 18 0 1 0 0 36A18 18 0 0 0 24 6z M24 16v9l7 4",
        x: 73, y: 10, size: 44, delay: "-5s", dur: 7, anim: "qb-float-c" },
      // Checkmark
      { path: "M8 24l10 12 22-22",
        x: 9,  y: 71, size: 40, delay: "-3s", dur: 6, anim: "qb-float-b" },
      // Bar chart (productivity / growth)
      { path: "M8 38V28h8v10H8z M20 38V18h8v20H20z M32 38V10h8v28H32z",
        x: 75, y: 64, size: 46, delay: "-7s", dur: 9, anim: "qb-float-a" },
    ],
  },

  camera: {
    color: "hsla(45,90%,60%,1)",
    icons: [
      // Camera body + lens
      { path: "M4 18h8l4-6h16l4 6h8v20H4V18z M24 32a7 7 0 1 0 0-14 7 7 0 0 0 0 14z",
        x: 5,  y: 8,  size: 48, delay: "-1s", dur: 7, anim: "qb-float-b" },
      // Film strip
      { path: "M4 10h40v32H4V10z M14 10v32 M34 10v32 M4 20h10 M34 20h10 M4 30h10 M34 30h10",
        x: 70, y: 12, size: 46, delay: "-4s", dur: 8, anim: "qb-float-a" },
      // Flash bolt
      { path: "M28 4l-8 18h8l-8 22 18-22h-10z",
        x: 8,  y: 70, size: 42, delay: "-6s", dur: 6, anim: "qb-float-c" },
      // Concentric lens / aperture circles
      { path: "M24 10a14 14 0 1 0 0 28 14 14 0 0 0 0-28z M24 16a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M24 22a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
        x: 76, y: 66, size: 44, delay: "-3s", dur: 9, anim: "qb-float-b" },
    ],
  },

  travel: {
    color: "hsla(190,85%,55%,1)",
    icons: [
      // Airplane (top-down)
      { path: "M24 6l10 10h8l-2 4-14-4-14 4-2-4h8Z M24 16v20 M20 30h8",
        x: 5,  y: 10, size: 48, delay: "-3s", dur: 7, anim: "qb-float-a" },
      // Suitcase
      { path: "M16 16v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4 M4 16h40v22a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V16z M24 16v26",
        x: 72, y: 8,  size: 44, delay: "-5s", dur: 8, anim: "qb-float-b" },
      // Location pin
      { path: "M24 4a14 14 0 0 1 14 14c0 10-14 26-14 26S10 28 10 18A14 14 0 0 1 24 4z M24 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
        x: 8,  y: 70, size: 46, delay: "-1s", dur: 6, anim: "qb-float-c" },
      // Compass rose
      { path: "M24 6a18 18 0 1 0 0 36A18 18 0 0 0 24 6z M30 14l-4 10-10 4 4-10z M24 6v4 M24 38v4 M6 24h4 M38 24h4",
        x: 74, y: 65, size: 42, delay: "-7s", dur: 9, anim: "qb-float-a" },
    ],
  },

  gaming: {
    color: "hsla(330,75%,60%,1)",
    icons: [
      // Gamepad
      { path: "M8 18h32a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4z M14 24h6 M17 21v6 M34 22a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M30 26a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
        x: 4,  y: 10, size: 50, delay: "-2s", dur: 6, anim: "qb-float-b" },
      // Star
      { path: "M24 5l4 9h10l-8 7 3 10-9-6-9 6 3-10-8-7h10z",
        x: 71, y: 8,  size: 44, delay: "-5s", dur: 8, anim: "qb-float-a" },
      // Crown
      { path: "M6 32V18l8 8 10-14 10 14 8-8v14H6z M6 32h36",
        x: 8,  y: 70, size: 46, delay: "-3s", dur: 7, anim: "qb-float-c" },
      // Targeting reticle
      { path: "M24 4v6 M24 38v6 M4 24h6 M38 24h6 M24 14a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M24 20a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
        x: 76, y: 65, size: 42, delay: "-7s", dur: 9, anim: "qb-float-b" },
    ],
  },

  communication: {
    color: "hsla(210,80%,60%,1)",
    icons: [
      // Chat bubble with text lines
      { path: "M8 8h32a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H26l-8 8v-8H8a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z M14 18h20 M14 24h12",
        x: 4,  y: 8,  size: 48, delay: "-1s", dur: 7, anim: "qb-float-a" },
      // Radio / signal waves
      { path: "M24 28a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M18 20a8 8 0 0 1 12 0 M12 15a16 16 0 0 1 24 0 M6 10a24 24 0 0 1 36 0 M24 28v10",
        x: 70, y: 10, size: 44, delay: "-4s", dur: 8, anim: "qb-float-b" },
      // Video camera
      { path: "M4 14h28a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z M34 20l10-6v20l-10-6",
        x: 8,  y: 68, size: 46, delay: "-6s", dur: 6, anim: "qb-float-c" },
      // Smartphone
      { path: "M14 6h20a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z M20 8h8 M24 36a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
        x: 76, y: 63, size: 44, delay: "-3s", dur: 9, anim: "qb-float-a" },
    ],
  },

  wellness: {
    color: "hsla(160,70%,55%,1)",
    icons: [
      // Lotus / flower
      { path: "M24 36s-12-6-12-14a12 12 0 0 1 24 0c0 8-12 14-12 14z M24 22v-10 M18 16s-4-8 0-10 4 6 6 10 M30 16s4-8 0-10-4 6-6 10",
        x: 5,  y: 10, size: 48, delay: "-2s", dur: 8, anim: "qb-float-a" },
      // Crescent moon
      { path: "M32 10A16 16 0 0 0 16 38a16 16 0 0 0 22-6 12 12 0 0 1-6-22z",
        x: 72, y: 8,  size: 44, delay: "-5s", dur: 9, anim: "qb-float-b" },
      // Leaf
      { path: "M12 40c0 0 8-20 28-28-8 8-18 22-28 28z M12 40l8-14",
        x: 8,  y: 70, size: 46, delay: "-1s", dur: 7, anim: "qb-float-c" },
      // Sparkle / radiant star
      { path: "M24 4v6 M24 38v6 M4 24h6 M38 24h6 M10 10l4 4 M34 34l4 4 M10 38l4-4 M34 14l4-4 M20 20l8 8 M20 28l8-8",
        x: 75, y: 67, size: 44, delay: "-7s", dur: 6, anim: "qb-float-a" },
    ],
  },
};

const FALLBACK = DATA.fitness;

interface QuizBackgroundProps {
  category: string;
}

const QuizBackground = memo(({ category }: QuizBackgroundProps) => {
  const d = DATA[category] ?? FALLBACK;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">

      {/* Central colour orb — cross-fades when category changes */}
      <AnimatePresence mode="wait">
        <motion.div
          key={category + "-orb"}
          className="absolute rounded-full"
          style={{
            left: "50%", top: "46%",
            width:  "clamp(260px, 40vmin, 520px)",
            height: "clamp(260px, 40vmin, 520px)",
            marginLeft: "calc(clamp(260px, 40vmin, 520px) / -2)",
            marginTop:  "calc(clamp(260px, 40vmin, 520px) / -2)",
            background: `radial-gradient(circle, ${d.color} 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.17, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>

      {/* Expanding pulse rings (CSS, three staggered) */}
      {["-0s", "-1.2s", "-2.4s"].map((delay, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: "50%", top: "46%",
            width:  "clamp(180px, 38vmin, 340px)",
            height: "clamp(180px, 38vmin, 340px)",
            borderRadius: "50%",
            border: `1.5px solid ${d.color}`,
            animationName: "qb-ring",
            animationDuration: "3.8s",
            animationDelay: delay,
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-out",
          }}
        />
      ))}

      {/* Category-specific floating icon silhouettes */}
      <AnimatePresence mode="wait">
        <motion.div
          key={category + "-icons"}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {d.icons.map((icon, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${icon.x}%`,
                top:  `${icon.y}%`,
                animationName: icon.anim,
                animationDuration: `${icon.dur}s`,
                animationDelay: icon.delay,
                animationIterationCount: "infinite",
                animationTimingFunction: "ease-in-out",
                animationFillMode: "both",
                willChange: "transform, opacity",
              }}
            >
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  width:  `max(${icon.size}px, ${(icon.size / 8).toFixed(1)}vmin)`,
                  height: `max(${icon.size}px, ${(icon.size / 8).toFixed(1)}vmin)`,
                }}
              >
                <path
                  d={icon.path}
                  stroke={d.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

export default QuizBackground;
