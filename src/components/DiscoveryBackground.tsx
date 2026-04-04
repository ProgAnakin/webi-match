import { memo } from "react";

/**
 * Welcome screen ambient background.
 *
 * Visual concept: mini swipe-cards with product icons floating upward,
 * some tilted mid-swipe, some showing SÌ ✓ / NO ✕ badges — communicating
 * the quiz mechanic before the customer reads a single word.
 *
 * All @keyframes are defined in index.css (processed by Vite/PostCSS),
 * which fixes iOS Safari parsing issues with inline <style> tags.
 * Colors use hsla() — the 4-argument hsl() form is not valid CSS.
 * Every animated property is transform or opacity — GPU compositor only.
 */

// Product icon paths (viewBox 0 0 40 40)
const ICONS = [
  // Headphones
  "M8 20a12 12 0 0 1 24 0M8 20v6a3 3 0 0 0 3 3h1v-9H8zM29 20v9h1a3 3 0 0 0 3-3v-6h-4z",
  // Smartwatch
  "M15 8h10v2H15zM15 30h10v2H15zM13 10h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2zM20 16v4l3 2",
  // TWS Earbuds
  "M14 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM26 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM14 22v6M26 22v6M11 28h6M23 28h6",
  // Gamepad
  "M6 20a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v3a8 8 0 0 1-8 8h-3l-3 3h-4l-3-3h-3a8 8 0 0 1-8-8v-3zM14 19v4M12 21h4M26 20h0M29 22h0M32 20h0M29 18h0",
  // Camera
  "M9 14h4l2-3h10l2 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2zM20 18a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
  // Speaker
  "M12 10h16a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4zM20 17a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM20 25a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM20 12h0",
  // Massage gun
  "M14 8h6a3 3 0 0 1 3 3v8h5a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-5v4a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3zM20 19h8",
  // Power bank
  "M13 6h14a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zM18 12h4M18 17h4M18 22h2M20 30a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
];

// 10 cards: position, animation timing, tilt, icon, badge
const CARDS = [
  { left: "3%",  delay: 0,   dur: 22, icon: 0, tilt: -6,  badge: null  },
  { left: "17%", delay: 5,   dur: 26, icon: 1, tilt:  8,  badge: "si"  },
  { left: "30%", delay: 10,  dur: 20, icon: 2, tilt: -4,  badge: null  },
  { left: "45%", delay: 2,   dur: 24, icon: 3, tilt:  5,  badge: "si"  },
  { left: "60%", delay: 7,   dur: 21, icon: 4, tilt: -10, badge: "no"  },
  { left: "74%", delay: 12,  dur: 27, icon: 5, tilt:  3,  badge: null  },
  { left: "87%", delay: 1,   dur: 23, icon: 6, tilt: -7,  badge: null  },
  { left: "11%", delay: 15,  dur: 19, icon: 7, tilt:  6,  badge: "no"  },
  { left: "52%", delay: 18,  dur: 25, icon: 0, tilt: -3,  badge: null  },
  { left: "80%", delay: 22,  dur: 22, icon: 3, tilt:  9,  badge: "si"  },
] as const;

const SWAY_NAMES = ["wb-sw0", "wb-sw1", "wb-sw2", "wb-sw3"];

const DiscoveryBackground = memo(() => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 overflow-hidden"
    style={{ zIndex: 0 }}
  >
    {/* ── Colour orbs (atmosphere) ─────────────────────────────── */}
    <div style={{
      position: "absolute", left: "-8%", top: "-5%",
      width: 500, height: 500, borderRadius: "50%",
      background: "radial-gradient(circle, hsla(27,92%,55%,0.9) 0%, transparent 70%)",
      filter: "blur(60px)", opacity: 0.20,
      animation: "wb-orb-a 19s ease-in-out infinite",
      willChange: "transform",
    }} />
    <div style={{
      position: "absolute", right: "-10%", top: "0%",
      width: 440, height: 440, borderRadius: "50%",
      background: "radial-gradient(circle, hsla(16,100%,50%,0.9) 0%, transparent 70%)",
      filter: "blur(70px)", opacity: 0.16,
      animation: "wb-orb-b 23s ease-in-out infinite",
      willChange: "transform",
    }} />
    <div style={{
      position: "absolute", right: "-6%", bottom: "4%",
      width: 380, height: 380, borderRadius: "50%",
      background: "radial-gradient(circle, hsla(27,92%,62%,0.9) 0%, transparent 70%)",
      filter: "blur(65px)", opacity: 0.14,
      animation: "wb-orb-c 21s ease-in-out infinite",
      willChange: "transform",
    }} />
    <div style={{
      position: "absolute", left: "-5%", bottom: "6%",
      width: 360, height: 360, borderRadius: "50%",
      background: "radial-gradient(circle, hsla(230,60%,55%,0.9) 0%, transparent 70%)",
      filter: "blur(70px)", opacity: 0.10,
      animation: "wb-orb-d 26s ease-in-out infinite",
      willChange: "transform",
    }} />

    {/* ── Static dot grid texture ───────────────────────────────── */}
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: "radial-gradient(circle, hsla(27,92%,55%,0.5) 1px, transparent 1px)",
      backgroundSize: "38px 38px",
      opacity: 0.06,
    }} />

    {/* ── Floating product swipe-cards ─────────────────────────── */}
    {CARDS.map((card, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: card.left,
          bottom: 0,
          animation: `wb-float-up ${card.dur}s linear ${card.delay}s infinite`,
          willChange: "transform, opacity",
        }}
      >
        {/* Sway layer */}
        <div style={{
          animation: `${SWAY_NAMES[i % 4]} ${10 + (i % 3) * 2}s ease-in-out infinite`,
          willChange: "transform",
        }}>
          {/* Card shell */}
          <div style={{
            position: "relative",
            width: 54, height: 72,
            borderRadius: 12,
            border: "1.5px solid hsla(27,92%,65%,0.45)",
            background: "linear-gradient(145deg, hsla(27,92%,55%,0.08) 0%, hsla(230,60%,50%,0.05) 100%)",
            transform: `rotate(${card.tilt}deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {/* Product icon */}
            <svg width={28} height={28} viewBox="0 0 40 40" fill="none">
              <path
                d={ICONS[card.icon]}
                stroke="hsla(27,92%,70%,0.9)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Match badge */}
            {card.badge === "si" && (
              <div style={{
                position: "absolute", top: 4, right: 4,
                width: 16, height: 16, borderRadius: "50%",
                background: "hsla(142,60%,45%,1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "white", fontWeight: 700,
                lineHeight: 1,
              }}>✓</div>
            )}
            {card.badge === "no" && (
              <div style={{
                position: "absolute", top: 4, left: 4,
                width: 16, height: 16, borderRadius: "50%",
                background: "hsla(0,72%,51%,1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "white", fontWeight: 700,
                lineHeight: 1,
              }}>✕</div>
            )}
          </div>
        </div>
      </div>
    ))}

    {/* ── Scanline (tech feel) ──────────────────────────────────── */}
    <div style={{
      position: "absolute", left: 0, right: 0, height: 2,
      background: "linear-gradient(90deg, transparent, hsla(27,92%,55%,0.5), transparent)",
      opacity: 0.08,
      animation: "wb-scanline 12s linear infinite",
      willChange: "transform",
    }} />
  </div>
));

export default DiscoveryBackground;
