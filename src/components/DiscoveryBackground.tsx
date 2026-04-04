import { memo } from "react";

/**
 * Welcome screen background: floating mini swipe-cards with product icons.
 * Cards drift upward slowly (like the quiz cards waiting to be swiped),
 * some tilted left/right, some showing SÌ ✓ / NO ✕ badges.
 * All animations via pure CSS @keyframes — GPU compositor thread only,
 * zero JS cost, zero impact on typing performance.
 */

// Minimal gadget SVG paths (viewBox 0 0 40 40)
const ICONS: { d: string }[] = [
  // Headphones
  { d: "M8 20a12 12 0 0 1 24 0M8 20v6a3 3 0 0 0 3 3h1v-9H8zM29 20v9h1a3 3 0 0 0 3-3v-6h-4z" },
  // Smartwatch
  { d: "M15 8h10v2H15zM15 30h10v2H15zM13 10h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2zM20 16v4l3 2" },
  // Earbuds (TWS)
  { d: "M14 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM26 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM14 22v6M26 22v6M11 28h6M23 28h6" },
  // Gamepad
  { d: "M6 20a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v3a8 8 0 0 1-8 8h-3l-3 3h-4l-3-3h-3a8 8 0 0 1-8-8v-3zM14 19v4M12 21h4M26 20h0M29 22h0M32 20h0M29 18h0" },
  // Camera
  { d: "M9 14h4l2-3h10l2 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2zM20 18a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" },
  // Bluetooth speaker
  { d: "M12 10h16a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4zM20 17a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM20 25a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM20 12h0" },
  // Massage gun
  { d: "M14 8h6a3 3 0 0 1 3 3v8h5a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-5v4a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3zM20 19h8" },
  // Power bank
  { d: "M13 6h14a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zM18 12h4M18 17h4M18 22h2M20 30a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" },
];

// 10 floating cards: position, timing, tilt, icon, optional badge
const CARDS = [
  { left: "3%",  delay: 0,   dur: 22, gadget: 0, tilt: -6,  badge: null       },
  { left: "17%", delay: 5,   dur: 26, gadget: 1, tilt:  8,  badge: "si"       },
  { left: "30%", delay: 10,  dur: 20, gadget: 2, tilt: -4,  badge: null       },
  { left: "45%", delay: 2,   dur: 24, gadget: 3, tilt:  5,  badge: "si"       },
  { left: "60%", delay: 7,   dur: 21, gadget: 4, tilt: -10, badge: "no"       },
  { left: "74%", delay: 12,  dur: 27, gadget: 5, tilt:  3,  badge: null       },
  { left: "87%", delay: 1,   dur: 23, gadget: 6, tilt: -7,  badge: null       },
  { left: "11%", delay: 15,  dur: 19, gadget: 7, tilt:  6,  badge: "no"       },
  { left: "52%", delay: 18,  dur: 25, gadget: 0, tilt: -3,  badge: null       },
  { left: "80%", delay: 22,  dur: 22, gadget: 3, tilt:  9,  badge: "si"       },
] as const;

// Sway variation so cards don't all move identically
const SWAY = [
  "@keyframes sw0{0%,100%{transform:translateX(0px)}50%{transform:translateX(-14px)}}",
  "@keyframes sw1{0%,100%{transform:translateX(0px)}50%{transform:translateX(16px)}}",
  "@keyframes sw2{0%,100%{transform:translateX(0px)}50%{transform:translateX(-10px)}}",
  "@keyframes sw3{0%,100%{transform:translateX(0px)}50%{transform:translateX(12px)}}",
];

const css = `
  ${SWAY.join("\n")}

  @keyframes float-up {
    0%   { transform: translateY(108vh); opacity: 0;    }
    6%   { opacity: 1; }
    92%  { opacity: 0.9; }
    100% { transform: translateY(-18vh); opacity: 0; }
  }

  @keyframes orb-a {
    0%,100%{transform:translate(0px,0px) scale(1)}
    35%{transform:translate(50px,-40px) scale(1.15)}
    70%{transform:translate(-30px,55px) scale(0.9)}
  }
  @keyframes orb-b {
    0%,100%{transform:translate(0px,0px) scale(1)}
    40%{transform:translate(-55px,35px) scale(1.18)}
    75%{transform:translate(38px,-50px) scale(0.92)}
  }
  @keyframes orb-c {
    0%,100%{transform:translate(0px,0px) scale(1)}
    30%{transform:translate(42px,45px) scale(1.12)}
    65%{transform:translate(-45px,-30px) scale(0.88)}
  }
  @keyframes orb-d {
    0%,100%{transform:translate(0px,0px) scale(1)}
    50%{transform:translate(-38px,-55px) scale(1.1)}
    80%{transform:translate(50px,28px) scale(0.93)}
  }
  @keyframes scanline {
    0%{transform:translateY(-100vh)}
    100%{transform:translateY(100vh)}
  }
`;

const DiscoveryBackground = memo(() => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 overflow-hidden"
    style={{ zIndex: 0 }}
  >
    <style>{css}</style>

    {/* ── Colour orbs ───────────────────────────────────────────── */}
    <div style={{ position:"absolute", left:"-8%",  top:"-5%",   width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,hsl(27,92%,55%) 0%,transparent 70%)", filter:"blur(60px)", opacity:0.2,  animation:"orb-a 19s ease-in-out infinite", willChange:"transform" }} />
    <div style={{ position:"absolute", right:"-10%", top:"0%",   width:440, height:440, borderRadius:"50%", background:"radial-gradient(circle,hsl(16,100%,50%) 0%,transparent 70%)", filter:"blur(70px)", opacity:0.16, animation:"orb-b 23s ease-in-out infinite", willChange:"transform" }} />
    <div style={{ position:"absolute", right:"-6%", bottom:"4%", width:380, height:380, borderRadius:"50%", background:"radial-gradient(circle,hsl(27,92%,62%) 0%,transparent 70%)", filter:"blur(65px)", opacity:0.14, animation:"orb-c 21s ease-in-out infinite", willChange:"transform" }} />
    <div style={{ position:"absolute", left:"-5%",  bottom:"6%", width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle,hsl(230,60%,55%) 0%,transparent 70%)", filter:"blur(70px)", opacity:0.10, animation:"orb-d 26s ease-in-out infinite", willChange:"transform" }} />

    {/* ── Subtle dot grid (static) ──────────────────────────────── */}
    <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,hsl(27,92%,55%) 1px,transparent 1px)", backgroundSize:"38px 38px", opacity:0.035 }} />

    {/* ── Floating product swipe-cards ─────────────────────────── */}
    {CARDS.map((card, i) => {
      const icon = ICONS[card.gadget];
      const swayAnim = `sw${i % 4} ${10 + (i % 3) * 2}s ease-in-out infinite`;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: card.left,
            bottom: "-12%",
            animation: `float-up ${card.dur}s linear ${card.delay}s infinite`,
            willChange: "transform",
          }}
        >
          {/* Sway wrapper */}
          <div style={{ animation: swayAnim, willChange: "transform" }}>
            {/* Card shell — rotated to suggest mid-swipe */}
            <div style={{
              position: "relative",
              width: 54,
              height: 72,
              borderRadius: 12,
              border: "1.5px solid hsl(27,92%,55%)",
              background: "linear-gradient(145deg, hsl(27,92%,55%,0.07) 0%, hsl(230,60%,50%,0.04) 100%)",
              opacity: 0.55,
              transform: `rotate(${card.tilt}deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(2px)",
            }}>
              {/* Product icon */}
              <svg
                width={28} height={28}
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d={icon.d}
                  stroke="hsl(27,92%,65%)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Badge SÌ / NO */}
              {card.badge === "si" && (
                <div style={{
                  position: "absolute",
                  top: 4, right: 4,
                  width: 16, height: 16,
                  borderRadius: "50%",
                  background: "hsl(142,60%,45%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: "white", fontWeight: 700,
                }}>✓</div>
              )}
              {card.badge === "no" && (
                <div style={{
                  position: "absolute",
                  top: 4, left: 4,
                  width: 16, height: 16,
                  borderRadius: "50%",
                  background: "hsl(0,72%,51%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: "white", fontWeight: 700,
                }}>✕</div>
              )}
            </div>
          </div>
        </div>
      );
    })}

    {/* ── Slow scanline (tech feel) ─────────────────────────────── */}
    <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,hsl(27,92%,55%),transparent)", opacity:0.07, animation:"scanline 12s linear infinite", willChange:"transform" }} />
  </div>
));

export default DiscoveryBackground;
