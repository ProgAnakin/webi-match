import { motion } from "framer-motion";
import { memo } from "react";

// Each ember has an explicit shape (w×h) so sparks travelling horizontally look
// physically correct — elongated along the direction of travel.
interface Ember {
  top:   number;
  dur:   number;
  delay: string;
  w:     number;
  h:     number;
  color: string;
  anim:  string;
}

const EMBERS: Ember[] = [
  // ── Left wall → travel right ──────────────────────────────────────────────
  { top: 16, dur: 6.2, delay: "-1.5s",  w: 4, h: 4, color: "#fb6b04", anim: "wb-ember-ltr"   },
  { top: 25, dur: 5.5, delay: "-4.2s",  w: 7, h: 2, color: "#f8a432", anim: "wb-ember-ltr-b" },
  { top: 36, dur: 7.1, delay: "-7.8s",  w: 3, h: 3, color: "#fcb498", anim: "wb-ember-ltr"   },
  { top: 47, dur: 5.8, delay: "-2.1s",  w: 5, h: 5, color: "#fb6b04", anim: "wb-ember-ltr-b" },
  { top: 57, dur: 6.8, delay: "-9.3s",  w: 6, h: 2, color: "#f8a432", anim: "wb-ember-ltr"   },
  { top: 68, dur: 5.3, delay: "-5.7s",  w: 2, h: 2, color: "#fb6b04", anim: "wb-ember-ltr-b" },
  { top: 78, dur: 7.4, delay: "-3.6s",  w: 3, h: 3, color: "#fcb498", anim: "wb-ember-ltr"   },
  { top: 21, dur: 6.0, delay: "-8.0s",  w: 7, h: 2, color: "#fb6b04", anim: "wb-ember-ltr-b" },
  { top: 42, dur: 7.6, delay: "-0.8s",  w: 2, h: 2, color: "#f8a432", anim: "wb-ember-ltr"   },
  { top: 62, dur: 5.1, delay: "-6.4s",  w: 4, h: 4, color: "#fcb498", anim: "wb-ember-ltr-b" },
  { top: 72, dur: 6.7, delay: "-10.2s", w: 5, h: 2, color: "#fb6b04", anim: "wb-ember-ltr"   },
  { top: 32, dur: 5.9, delay: "-11.5s", w: 6, h: 2, color: "#f8a432", anim: "wb-ember-ltr-b" },
  // ── Right wall → travel left ───────────────────────────────────────────────
  { top: 18, dur: 6.4, delay: "-3.2s",  w: 3, h: 3, color: "#f8a432", anim: "wb-ember-rtl"   },
  { top: 28, dur: 5.7, delay: "-7.0s",  w: 6, h: 2, color: "#fb6b04", anim: "wb-ember-rtl-b" },
  { top: 40, dur: 7.2, delay: "-1.4s",  w: 4, h: 4, color: "#fcb498", anim: "wb-ember-rtl"   },
  { top: 51, dur: 5.6, delay: "-9.1s",  w: 2, h: 2, color: "#fb6b04", anim: "wb-ember-rtl-b" },
  { top: 61, dur: 6.9, delay: "-4.5s",  w: 7, h: 2, color: "#f8a432", anim: "wb-ember-rtl"   },
  { top: 74, dur: 5.2, delay: "-6.8s",  w: 3, h: 3, color: "#fcb498", anim: "wb-ember-rtl-b" },
  { top: 83, dur: 7.7, delay: "-2.3s",  w: 4, h: 2, color: "#fb6b04", anim: "wb-ember-rtl"   },
  { top: 23, dur: 6.1, delay: "-8.6s",  w: 2, h: 2, color: "#f8a432", anim: "wb-ember-rtl-b" },
  { top: 45, dur: 7.5, delay: "-0.5s",  w: 5, h: 5, color: "#fb6b04", anim: "wb-ember-rtl"   },
  { top: 64, dur: 5.4, delay: "-5.1s",  w: 3, h: 2, color: "#fcb498", anim: "wb-ember-rtl-b" },
  { top: 76, dur: 6.6, delay: "-10.7s", w: 4, h: 4, color: "#fb6b04", anim: "wb-ember-rtl"   },
  { top: 35, dur: 5.8, delay: "-12.0s", w: 6, h: 2, color: "#f8a432", anim: "wb-ember-rtl-b" },
];

// Inline SVG recreation of the Webidoo logo mark.
// The existing PNG has a white background and cannot be used directly on dark.
// Shape: horizontal horseshoe (open at bottom) + leaf on top-right + downward triangle.
// Gradient defined once in a hidden SVG defs block above and referenced by id.
const WebidooMark = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={Math.round(size * 0.9)}
    viewBox="0 0 110 100"
    fill="none"
    overflow="visible"
  >
    {/* Horseshoe body — single closed path:
        outer U-shape → step inward → inner slot (reversed) → close across arm base */}
    <path
      fill="url(#wb-mark-grad)"
      d="
        M 12,82
        C 4,82 4,20 55,16
        C 106,20 106,82 98,82
        L 83,72
        C 95,68 95,28 55,24
        C 15,28 15,68 27,72
        Z
      "
    />
    {/* Leaf / flame — sits on the top-right of the body */}
    <path
      fill="url(#wb-mark-grad)"
      d="
        M 66,16
        C 66,4 82,0 78,14
        C 84,-2 74,-6 62,8
        C 54,-2 48,6 52,14
        C 56,4 66,4 66,16
        Z
      "
    />
    {/* Downward arrow — fills the gap between the two arms */}
    <path
      fill="url(#wb-mark-grad)"
      d="M 27,72 L 83,72 L 55,90 Z"
    />
  </svg>
);

// Bounce paths follow a rectangular loop so the mark touches every edge.
// x/y are relative to the element's centre (positioned at 50%,50%).
// Bounds chosen so the mark stays clear of the progress bar (top) and
// action buttons (bottom) on any iPad size.
const MARKS = [
  {
    size:        82,
    bounceDur:   42,           // seconds for one full rectangular loop
    opacityDur:  8,            // independent breathing cycle
    // clockwise: TL → TR → BR → BL → TL
    x: ["-38vw",  "36vw",  "36vw", "-38vw", "-38vw"],
    y: ["-26vh", "-26vh",  "26vh",  "26vh", "-26vh"],
    opacityStart: 0,           // Framer Motion initial for opacity keyframes
  },
  {
    size:        56,
    bounceDur:   32,
    opacityDur:  6,
    // counter-clockwise starting opposite corner: BR → BL → TL → TR → BR
    x: ["36vw", "-38vw", "-38vw",  "36vw",  "36vw"],
    y: ["26vh",  "26vh", "-26vh", "-26vh",  "26vh"],
    opacityStart: 14,          // half-cycle offset so marks aren't in phase
  },
] as const;

const QuizBackground = memo(() => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">

    {/* Shared gradient definition — referenced by all WebidooMark SVGs */}
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="wb-mark-grad" x1="0" y1="0" x2="110" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fca83a" />
          <stop offset="55%"  stopColor="#fb6b04" />
          <stop offset="100%" stopColor="#e83010" />
        </linearGradient>
      </defs>
    </svg>

    {/* ── Webidoo mark — bounces like a screensaver across the background ──────
        Two instances: outer motion.div carries the position (box-path bounce),
        inner motion.div breathes opacity independently.
        Using linear timing on position gives a true constant-speed screensaver feel.
        Opacity cycles independently so the mark fades in/out regardless of position. */}
    {MARKS.map((m, i) => (
      <motion.div
        key={i}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          willChange: "transform",
        }}
        animate={{ x: m.x, y: m.y }}
        transition={{
          duration: m.bounceDur,
          repeat: Infinity,
          ease: "linear",
          delay: i === 1 ? m.bounceDur / 2 : 0, // offset second mark by half-cycle
        }}
      >
        <motion.div
          style={{
            marginLeft: -m.size / 2,
            marginTop:  -Math.round(m.size * 0.9) / 2,
            willChange: "opacity",
          }}
          animate={{ opacity: [0.06, 0.26, 0.10, 0.24, 0.06] }}
          transition={{
            duration: m.opacityDur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: m.opacityStart,
          }}
        >
          <WebidooMark size={m.size} />
        </motion.div>
      </motion.div>
    ))}

    {/* ── Ember Float ───────────────────────────────────────────────────────────
        Sparks launch from left/right walls, bounded to 14–84% of screen height
        so they never overlap the progress bar or action buttons.            */}
    {EMBERS.map((e, i) => {
      const fromLeft = e.anim.startsWith("wb-ember-ltr");
      return (
        <div
          key={i}
          style={{
            position:     "absolute",
            top:          `${e.top}%`,
            [fromLeft ? "left" : "right"]: -8,
            width:        e.w,
            height:       e.h,
            borderRadius: e.w === e.h ? "50%" : 2,
            background:   e.color,
            animation:    `${e.anim} ${e.dur}s ease-out ${e.delay} infinite`,
            willChange:   "transform, opacity",
          }}
        />
      );
    })}
  </div>
));

export default QuizBackground;
