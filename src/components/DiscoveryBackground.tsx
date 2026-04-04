import { memo } from "react";

/**
 * Welcome background: floating product emojis + large YES/NO game indicators.
 *
 * Key fix for "stuck at bottom": all emojis use NEGATIVE animation-delay,
 * which means they are already mid-flight at page load — distributed naturally
 * across the full screen height. No element ever sits at its static position.
 *
 * All @keyframes are in index.css (processed by Vite → works on iOS Safari).
 * Only transform + opacity animated → GPU compositor, zero JS thread cost.
 */

// Products the quiz covers — emojis render natively, no SVG/font issues
const FLOATERS = [
  { left: "5%",  delay: "-4s",  dur: "20s", emoji: "🎧", size: 34, sway: "wb-sway-l", swayDur: "9s"  },
  { left: "16%", delay: "-11s", dur: "25s", emoji: "⌚", size: 30, sway: "wb-sway-r", swayDur: "11s" },
  { left: "28%", delay: "-7s",  dur: "18s", emoji: "🎮", size: 36, sway: "wb-sway-s", swayDur: "8s"  },
  { left: "41%", delay: "-17s", dur: "22s", emoji: "📷", size: 28, sway: "wb-sway-l", swayDur: "12s" },
  { left: "54%", delay: "-3s",  dur: "21s", emoji: "🔊", size: 32, sway: "wb-sway-r", swayDur: "10s" },
  { left: "66%", delay: "-14s", dur: "24s", emoji: "🎵", size: 30, sway: "wb-sway-s", swayDur: "9s"  },
  { left: "78%", delay: "-8s",  dur: "19s", emoji: "💪", size: 28, sway: "wb-sway-l", swayDur: "11s" },
  { left: "88%", delay: "-20s", dur: "23s", emoji: "✨", size: 26, sway: "wb-sway-r", swayDur: "8s"  },
  { left: "11%", delay: "-22s", dur: "26s", emoji: "🎯", size: 30, sway: "wb-sway-s", swayDur: "13s" },
  { left: "47%", delay: "-9s",  dur: "20s", emoji: "🎧", size: 28, sway: "wb-sway-r", swayDur: "10s" },
  { left: "72%", delay: "-16s", dur: "22s", emoji: "⌚", size: 32, sway: "wb-sway-l", swayDur: "12s" },
  { left: "33%", delay: "-5s",  dur: "17s", emoji: "🎮", size: 26, sway: "wb-sway-s", swayDur: "9s"  },
];

const DiscoveryBackground = memo(() => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 overflow-hidden"
    style={{ zIndex: 0 }}
  >
    {/* ── Colour orbs — warm atmosphere ────────────────────────── */}
    <div style={{ position:"absolute", left:"-8%", top:"-5%", width:480, height:480, borderRadius:"50%", background:"radial-gradient(circle,hsla(27,92%,55%,0.85) 0%,transparent 70%)", filter:"blur(60px)", opacity:0.22, animation:"wb-orb-a 19s ease-in-out infinite", willChange:"transform" }} />
    <div style={{ position:"absolute", right:"-10%", top:"0%", width:420, height:420, borderRadius:"50%", background:"radial-gradient(circle,hsla(16,100%,50%,0.85) 0%,transparent 70%)", filter:"blur(70px)", opacity:0.17, animation:"wb-orb-b 23s ease-in-out infinite", willChange:"transform" }} />
    <div style={{ position:"absolute", right:"-6%", bottom:"4%", width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle,hsla(27,92%,62%,0.85) 0%,transparent 70%)", filter:"blur(65px)", opacity:0.14, animation:"wb-orb-c 21s ease-in-out infinite", willChange:"transform" }} />
    <div style={{ position:"absolute", left:"-5%", bottom:"6%", width:340, height:340, borderRadius:"50%", background:"radial-gradient(circle,hsla(230,60%,55%,0.85) 0%,transparent 70%)", filter:"blur(70px)", opacity:0.11, animation:"wb-orb-d 26s ease-in-out infinite", willChange:"transform" }} />

    {/* ── Static dot grid ───────────────────────────────────────── */}
    <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,hsla(27,92%,55%,0.45) 1px,transparent 1px)", backgroundSize:"38px 38px", opacity:0.07 }} />

    {/* ── Game indicators: ✕ left  ♥ right ────────────────────── */}
    {/* Instantly communicates "swipe left = NO, swipe right = SÌ" */}
    <div style={{
      position:"absolute", left:"2%", top:"30%",
      fontSize:130, lineHeight:1, color:"hsla(0,75%,58%,1)",
      fontWeight:900, userSelect:"none",
      animation:"wb-breathe-l 4s ease-in-out infinite",
      willChange:"transform, opacity",
    }}>✕</div>
    <div style={{
      position:"absolute", right:"2%", top:"30%",
      fontSize:130, lineHeight:1, color:"hsla(142,60%,48%,1)",
      fontWeight:900, userSelect:"none",
      animation:"wb-breathe-r 4s ease-in-out 0.5s infinite",
      willChange:"transform, opacity",
    }}>♥</div>

    {/* ── Floating product emojis ───────────────────────────────── */}
    {/* Negative delay = already mid-flight at load → never stuck at bottom */}
    {FLOATERS.map((f, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: f.left,
          top: "105vh", // natural start: just below viewport
          animation: `wb-emoji-float ${f.dur} linear ${f.delay} infinite`,
          willChange: "transform, opacity",
        }}
      >
        {/* Sway wrapper — separate transform axis */}
        <div style={{ animation: `${f.sway} ${f.swayDur} ease-in-out infinite`, willChange:"transform" }}>
          <span style={{ fontSize: f.size, lineHeight: 1, display:"block" }}>{f.emoji}</span>
        </div>
      </div>
    ))}

    {/* ── Slow scanline ─────────────────────────────────────────── */}
    <div style={{ position:"absolute", left:0, right:0, top:0, height:2, background:"linear-gradient(90deg,transparent,hsla(27,92%,55%,0.5),transparent)", opacity:0.07, animation:"wb-scanline 10s linear infinite", willChange:"transform" }} />
  </div>
));

export default DiscoveryBackground;
