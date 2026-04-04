import { memo } from "react";

/**
 * Lightweight ambient background using pure CSS animations.
 * CSS @keyframes run entirely on the GPU compositor thread —
 * zero JS involvement, zero impact on React state updates or typing.
 *
 * Previous version had 59 Framer Motion elements (16 gadgets + 6 orbs + 35 particles + 2 scanlines)
 * causing janky typing and scroll lag. This version uses 4 CSS-animated orbs only.
 */
const DiscoveryBackground = memo(() => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 overflow-hidden"
    style={{ zIndex: 0 }}
  >
    <style>{`
      @keyframes orb-a {
        0%,100% { transform: translate(0px,   0px)  scale(1);    }
        30%     { transform: translate(55px, -45px)  scale(1.18); }
        65%     { transform: translate(-35px, 60px)  scale(0.88); }
      }
      @keyframes orb-b {
        0%,100% { transform: translate(0px,  0px)  scale(1);    }
        40%     { transform: translate(-60px, 40px)  scale(1.2);  }
        70%     { transform: translate(40px, -55px)  scale(0.9);  }
      }
      @keyframes orb-c {
        0%,100% { transform: translate(0px,  0px)  scale(1);    }
        35%     { transform: translate(45px,  50px)  scale(1.15); }
        75%     { transform: translate(-50px,-35px)  scale(0.92); }
      }
      @keyframes orb-d {
        0%,100% { transform: translate(0px,  0px)  scale(1);    }
        50%     { transform: translate(-40px,-60px)  scale(1.12); }
        80%     { transform: translate(55px,  30px)  scale(0.95); }
      }
      @keyframes grid-pulse {
        0%,100% { opacity: 0.028; }
        50%     { opacity: 0.048; }
      }
      @keyframes scanline {
        0%   { transform: translateY(-100vh); }
        100% { transform: translateY(100vh);  }
      }
    `}</style>

    {/* Orb A — top-left, warm orange */}
    <div style={{
      position: "absolute",
      left: "-8%", top: "-5%",
      width: 520, height: 520,
      borderRadius: "50%",
      background: "radial-gradient(circle, hsl(27,92%,55%) 0%, transparent 70%)",
      filter: "blur(60px)",
      opacity: 0.22,
      animation: "orb-a 18s ease-in-out infinite",
      willChange: "transform",
    }} />

    {/* Orb B — top-right, deep orange */}
    <div style={{
      position: "absolute",
      right: "-12%", top: "0%",
      width: 460, height: 460,
      borderRadius: "50%",
      background: "radial-gradient(circle, hsl(16,100%,50%) 0%, transparent 70%)",
      filter: "blur(70px)",
      opacity: 0.18,
      animation: "orb-b 22s ease-in-out infinite",
      willChange: "transform",
    }} />

    {/* Orb C — bottom-right, amber */}
    <div style={{
      position: "absolute",
      right: "-5%", bottom: "5%",
      width: 400, height: 400,
      borderRadius: "50%",
      background: "radial-gradient(circle, hsl(27,92%,60%) 0%, transparent 70%)",
      filter: "blur(65px)",
      opacity: 0.16,
      animation: "orb-c 20s ease-in-out infinite",
      willChange: "transform",
    }} />

    {/* Orb D — bottom-left, indigo accent */}
    <div style={{
      position: "absolute",
      left: "-6%", bottom: "8%",
      width: 380, height: 380,
      borderRadius: "50%",
      background: "radial-gradient(circle, hsl(230,65%,55%) 0%, transparent 70%)",
      filter: "blur(70px)",
      opacity: 0.12,
      animation: "orb-d 25s ease-in-out infinite",
      willChange: "transform",
    }} />

    {/* Static dot grid — no animation cost, adds depth */}
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: "radial-gradient(circle, hsl(27,92%,55%) 1px, transparent 1px)",
      backgroundSize: "36px 36px",
      animation: "grid-pulse 8s ease-in-out infinite",
    }} />

    {/* Single slow scanline */}
    <div style={{
      position: "absolute", left: 0, right: 0,
      height: 2,
      background: "linear-gradient(90deg, transparent, hsl(27,92%,55%), transparent)",
      opacity: 0.08,
      animation: "scanline 10s linear infinite",
      willChange: "transform",
    }} />
  </div>
));

export default DiscoveryBackground;
