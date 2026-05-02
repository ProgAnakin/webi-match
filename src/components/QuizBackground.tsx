import { motion } from "framer-motion";
import { memo } from "react";

// Same product silhouettes as WelcomeScreen — creates visual continuity across
// all three screens without duplicating the @keyframes (already in index.css).
const PRODUCTS = {
  smartwatch:  "M17 6h14v5H17z M17 37h14v5H17z M14 11h20a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z M24 20v5l4 2",
  headphones:  "M9 26V19a15 15 0 0 1 30 0v7 M9 22v12a4 4 0 0 0 4 4h2V22H9z M39 22v16h-2a4 4 0 0 1-4-4V22h6z",
  powerbank:   "M17 4h14a3 3 0 0 1 3 3v34a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z M21 13h6 M21 19h6 M21 25h4 M24 35a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M21 1h6v3h-6z",
  airtag:      "M24 6a18 18 0 1 0 0 36A18 18 0 0 0 24 6z M24 14a10 10 0 1 0 0 20A10 10 0 0 0 24 14z M24 20a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M24 6v4 M24 38v4 M6 24h4 M38 24h4",
  massageGun:  "M15 8h8a4 4 0 0 1 4 4v9h8a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-8v6a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z M27 21h12",
  miniSpeaker: "M14 12h20a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z M24 17a7 7 0 1 0 0 14 7 7 0 0 0 0-17z M24 21a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M8 18v12 M40 18v12 M19 6l-4 6 M29 6l4 6",
} as const;

type ProductKey = keyof typeof PRODUCTS;

// Positioned on the edges so the card always remains the clear focal point
const ICONS: { x: number; y: number; dur: number; delay: string; product: ProductKey; size: number }[] = [
  { x:  2, y:  5, dur: 11, delay: "-3s", product: "headphones",  size: 34 },
  { x: 78, y:  3, dur: 12, delay: "-7s", product: "smartwatch",  size: 30 },
  { x: 88, y: 22, dur: 10, delay: "-1s", product: "airtag",      size: 28 },
  { x:  0, y: 46, dur: 13, delay: "-5s", product: "massageGun",  size: 34 },
  { x: 86, y: 55, dur: 11, delay: "-9s", product: "miniSpeaker", size: 30 },
  { x:  4, y: 78, dur: 10, delay: "-2s", product: "powerbank",   size: 28 },
  { x: 80, y: 82, dur: 12, delay: "-6s", product: "headphones",  size: 32 },
  { x: 44, y:  1, dur:  9, delay: "-4s", product: "airtag",      size: 26 },
  { x: 42, y: 90, dur: 11, delay: "-8s", product: "smartwatch",  size: 28 },
];

const ORANGE = "hsla(27,92%,70%,1)";

// `circle closest-side` keeps the gradient entirely within each orb div —
// no hard rectangular edges are visible in any browser or GPU compositing layer.
const QuizBackground = memo(() => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">

    {/* Orb 1 — Webidoo orange, top-left */}
    <motion.div
      className="absolute"
      style={{
        left: "-18%", top: "-24%",
        width: "80%", height: "80%",
        background: "radial-gradient(circle closest-side, hsl(18,92%,58%) 0%, transparent 100%)",
        opacity: 0.64,
        willChange: "transform",
      }}
      animate={{ x: [0, 52, -24, 40, 0], y: [0, 34, -20, 44, 0], scale: [1, 1.14, 0.90, 1.10, 1] }}
      transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Orb 2 — Webidoo navy blue, bottom-right */}
    <motion.div
      className="absolute"
      style={{
        right: "-20%", bottom: "-28%",
        width: "82%", height: "82%",
        background: "radial-gradient(circle closest-side, hsl(224,82%,56%) 0%, transparent 100%)",
        opacity: 0.60,
        willChange: "transform",
      }}
      animate={{ x: [0, -44, 20, -38, 0], y: [0, -30, 18, -40, 0], scale: [1, 0.88, 1.16, 0.94, 1] }}
      transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 5 }}
    />

    {/* Orb 3 — warm amber, centre drift */}
    <motion.div
      className="absolute"
      style={{
        left: "12%", top: "24%",
        width: "62%", height: "62%",
        background: "radial-gradient(circle closest-side, hsl(38,96%,62%) 0%, transparent 100%)",
        opacity: 0.38,
        willChange: "transform",
      }}
      animate={{ x: [0, 38, -30, 46, 0], y: [0, -32, 24, -22, 0], scale: [1, 1.18, 0.86, 1.12, 1] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 10 }}
    />

    {/* Vignette — lighter than before so orbs remain visible behind the card */}
    <div
      className="absolute inset-0"
      style={{
        background: "radial-gradient(ellipse 80% 74% at 50% 50%, transparent 35%, hsl(228,61%,9% / 0.52) 90%)",
      }}
    />

    {/* Product silhouettes — same visual language as WelcomeScreen */}
    {ICONS.map((icon, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${icon.x}%`,
          top:  `${icon.y}%`,
          animation: `wb-icon-appear ${icon.dur}s ease-in-out ${icon.delay} infinite`,
          willChange: "opacity, transform",
        }}
      >
        <svg width={icon.size} height={icon.size} viewBox="0 0 48 48" fill="none">
          <path
            d={PRODUCTS[icon.product]}
            stroke={ORANGE}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ))}
  </div>
));

export default QuizBackground;
