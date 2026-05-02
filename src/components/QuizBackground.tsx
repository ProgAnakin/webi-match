import { motion } from "framer-motion";
import { memo } from "react";

// Each ember has an explicit shape (w×h) so sparks travelling horizontally look
// physically correct — elongated along the direction of travel.
interface Ember {
  top:   number;  // % from top — kept within 14–84% to avoid progress bar & buttons
  dur:   number;  // animation duration in seconds
  delay: string;  // negative = already mid-cycle at load, so embers appear immediately
  w:     number;  // px
  h:     number;  // px
  color: string;
  anim:  string;  // keyframe name (encodes side + vertical-drift variant)
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

// `circle closest-side` keeps orb gradients within their div — no hard edges.
const QuizBackground = memo(() => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">

    {/* Orb 1 — Webidoo orange, top-left — provides warm atmospheric base */}
    <motion.div
      className="absolute"
      style={{
        left: "-18%", top: "-24%",
        width: "80%", height: "80%",
        background: "radial-gradient(circle closest-side, hsl(18,92%,58%) 0%, transparent 100%)",
        opacity: 0.58,
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
        opacity: 0.55,
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
        opacity: 0.32,
        willChange: "transform",
      }}
      animate={{ x: [0, 38, -30, 46, 0], y: [0, -32, 24, -22, 0], scale: [1, 1.18, 0.86, 1.12, 1] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 10 }}
    />

    {/* Vignette — pulls focus toward the card */}
    <div
      className="absolute inset-0"
      style={{
        background: "radial-gradient(ellipse 80% 74% at 50% 50%, transparent 35%, hsl(228,61%,9% / 0.50) 90%)",
      }}
    />

    {/* ── Ember Float ──────────────────────────────────────────────────────────
        Particles launch from left/right walls and drift inward, staying clear
        of the progress bar (top) and action buttons (bottom) since top values
        are bounded to 14 %–84 % of screen height. Elongated w×h pairs on
        horizontally-travelling embers mimic real sparks blown sideways.     */}
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
