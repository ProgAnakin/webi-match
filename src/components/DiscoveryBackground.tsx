import { memo } from "react";

/**
 * Welcome background: product SVG silhouettes (stroke-only, light orange)
 * that appear and disappear via opacity animation — like a constellation
 * of gadgets waiting to be matched.
 *
 * No float/translate → elements stay at fixed positions on screen.
 * Negative animation-delay = icons start mid-cycle, immediately visible.
 * All @keyframes in index.css → reliable on iOS Safari.
 */

// ── Product SVG paths (viewBox 0 0 48 48, stroke-only) ──────────────────────
const PRODUCTS = {
  smartwatch: "M17 6h14v5H17z M17 37h14v5H17z M14 11h20a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z M24 20v5l4 2",
  massageGun: "M15 8h8a4 4 0 0 1 4 4v9h8a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-8v6a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z M27 21h12",
  ledMask:    "M9 22c0-9 7-16 15-16s15 7 15 16v4c0 10-6 17-15 18-9-1-15-8-15-18v-4z M17 22a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0z M26 22a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0z M20 33c2 2 6 2 8 0 M11 18l-4-6 M37 18l4-6",
  headphones: "M9 26V19a15 15 0 0 1 30 0v7 M9 22v12a4 4 0 0 0 4 4h2V22H9z M39 22v16h-2a4 4 0 0 1-4-4V22h6z",
  powerbank:  "M17 4h14a3 3 0 0 1 3 3v34a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z M21 13h6 M21 19h6 M21 25h4 M24 35a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M21 1h6v3h-6z",
  bigSpeaker: "M8 7h32a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4z M24 14a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M24 19a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M8 36a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
  miniSpeaker:"M14 12h20a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z M24 17a7 7 0 1 0 0 14 7 7 0 0 0 0-17z M24 21a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M8 18v12 M40 18v12 M19 6l-4 6 M29 6l4 6",
  projector:  "M6 17h30a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4z M36 21v6l10-4-10-2v0z M12 21a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M20 22h10 M20 26h8 M14 11l-2-7 M20 11v-7 M28 11l2-7 M14 37l-2 7 M28 37l2 7",
  airtag:     "M24 6a18 18 0 1 0 0 36A18 18 0 0 0 24 6z M24 14a10 10 0 1 0 0 20A10 10 0 0 0 24 14z M24 20a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M24 6v4 M24 38v4 M6 24h4 M38 24h4",
} as const;

type ProductKey = keyof typeof PRODUCTS;

// ── 24 icon instances scattered across the screen ───────────────────────────
// (x, y) in %, duration in seconds, negative delay = mid-cycle at load
const ICONS: { x: number; y: number; dur: number; delay: string; product: ProductKey; size: number }[] = [
  { x:  4, y:  8, dur: 10, delay: "-2s",  product: "headphones",  size: 44 },
  { x: 22, y:  5, dur: 12, delay: "-5s",  product: "smartwatch",  size: 38 },
  { x: 42, y:  3, dur:  9, delay: "-3s",  product: "airtag",      size: 36 },
  { x: 62, y:  7, dur: 13, delay: "-7s",  product: "massageGun",  size: 42 },
  { x: 80, y:  4, dur: 11, delay: "-1s",  product: "miniSpeaker", size: 40 },
  { x: 92, y: 12, dur: 10, delay: "-8s",  product: "ledMask",     size: 44 },
  { x:  2, y: 30, dur: 12, delay: "-4s",  product: "projector",   size: 46 },
  { x: 14, y: 25, dur: 10, delay: "-9s",  product: "powerbank",   size: 36 },
  { x: 30, y: 28, dur: 11, delay: "-2s",  product: "bigSpeaker",  size: 48 },
  { x: 50, y: 22, dur:  9, delay: "-6s",  product: "airtag",      size: 32 },
  { x: 68, y: 30, dur: 13, delay: "-3s",  product: "smartwatch",  size: 40 },
  { x: 85, y: 24, dur: 10, delay: "-7s",  product: "headphones",  size: 42 },
  { x:  7, y: 55, dur: 11, delay: "-5s",  product: "airtag",      size: 34 },
  { x: 20, y: 50, dur: 12, delay: "-1s",  product: "miniSpeaker", size: 44 },
  { x: 38, y: 52, dur:  9, delay: "-8s",  product: "massageGun",  size: 40 },
  { x: 56, y: 48, dur: 13, delay: "-4s",  product: "ledMask",     size: 46 },
  { x: 74, y: 54, dur: 10, delay: "-2s",  product: "powerbank",   size: 38 },
  { x: 90, y: 46, dur: 11, delay: "-9s",  product: "projector",   size: 44 },
  { x:  3, y: 76, dur: 12, delay: "-3s",  product: "bigSpeaker",  size: 50 },
  { x: 18, y: 72, dur: 10, delay: "-6s",  product: "smartwatch",  size: 36 },
  { x: 35, y: 78, dur:  9, delay: "-1s",  product: "headphones",  size: 42 },
  { x: 53, y: 70, dur: 13, delay: "-7s",  product: "airtag",      size: 34 },
  { x: 70, y: 76, dur: 11, delay: "-4s",  product: "massageGun",  size: 40 },
  { x: 86, y: 68, dur: 10, delay: "-2s",  product: "miniSpeaker", size: 38 },
  // Extra row at the very bottom — fills empty space on tall/wide screens
  { x: 10, y: 86, dur: 11, delay: "-6s",  product: "airtag",      size: 34 },
  { x: 30, y: 90, dur:  9, delay: "-3s",  product: "smartwatch",  size: 36 },
  { x: 52, y: 85, dur: 12, delay: "-8s",  product: "headphones",  size: 38 },
  { x: 72, y: 89, dur: 10, delay: "-1s",  product: "projector",   size: 40 },
  { x: 88, y: 83, dur: 11, delay: "-5s",  product: "powerbank",   size: 34 },
];

const ORANGE = "hsla(27,92%,70%,1)";

const DiscoveryBackground = memo(() => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 overflow-hidden"
    style={{ zIndex: 0 }}
  >
    {/* ── Colour orbs — warm atmosphere ─────────────────────────────────
        Sizes use max(fixed_px, vw) so on large screens (MacBook/desktop)
        the orbs grow to fill the viewport; phones stay at the fixed_px floor.
        A 5th centered bottom orb fills the gap that corners leave on wide screens. */}
    <div style={{ position:"absolute", left:"-8%", top:"-5%", width:"max(480px,35vw)", height:"max(480px,35vw)", borderRadius:"50%", background:"radial-gradient(circle,hsla(27,92%,55%,0.85) 0%,transparent 70%)", filter:"blur(max(60px,5vw))", opacity:0.20, animation:"wb-orb-a 19s ease-in-out infinite", willChange:"transform" }} />
    <div style={{ position:"absolute", right:"-10%", top:"0", width:"max(420px,30vw)", height:"max(420px,30vw)", borderRadius:"50%", background:"radial-gradient(circle,hsla(16,100%,50%,0.85) 0%,transparent 70%)", filter:"blur(max(70px,5.5vw))", opacity:0.16, animation:"wb-orb-b 23s ease-in-out infinite", willChange:"transform" }} />
    <div style={{ position:"absolute", right:"-6%", bottom:"4%", width:"max(360px,28vw)", height:"max(360px,28vw)", borderRadius:"50%", background:"radial-gradient(circle,hsla(27,92%,62%,0.85) 0%,transparent 70%)", filter:"blur(max(65px,5vw))", opacity:0.13, animation:"wb-orb-c 21s ease-in-out infinite", willChange:"transform" }} />
    <div style={{ position:"absolute", left:"-5%", bottom:"6%", width:"max(340px,26vw)", height:"max(340px,26vw)", borderRadius:"50%", background:"radial-gradient(circle,hsla(230,60%,55%,0.85) 0%,transparent 70%)", filter:"blur(max(70px,5.5vw))", opacity:0.10, animation:"wb-orb-d 26s ease-in-out infinite", willChange:"transform" }} />
    {/* 5th orb — centre-bottom, fills the horizontal gap on MacBook */}
    <div style={{ position:"absolute", left:"50%", bottom:"-8%", width:"max(400px,30vw)", height:"max(400px,30vw)", marginLeft:"max(-200px,-15vw)", borderRadius:"50%", background:"radial-gradient(circle,hsla(27,92%,58%,0.85) 0%,transparent 70%)", filter:"blur(max(70px,5.5vw))", opacity:0.11, animation:"wb-orb-a 22s ease-in-out 8s infinite", willChange:"transform" }} />

    {/* ── Product icon silhouettes ──────────────────────────────── */}
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
        <svg
          width={icon.size}
          height={icon.size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
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

    {/* ── Slow scanline ─────────────────────────────────────────── */}
    <div style={{ position:"absolute", left:0, right:0, top:0, height:2, background:"linear-gradient(90deg,transparent,hsla(27,92%,55%,0.4),transparent)", opacity:0.06, animation:"wb-scanline 12s linear infinite", willChange:"transform" }} />
  </div>
));

export default DiscoveryBackground;
