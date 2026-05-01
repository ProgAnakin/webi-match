import { motion } from "framer-motion";

// Minimalist Webidoo-branded background — three soft orbs breathing slowly.
// Fixed colors (no per-card changes), never remounts, very low visual noise.
const QuizBackground = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">

    {/* Orange accent — top-left bleed (Webidoo primary) */}
    <motion.div
      className="absolute rounded-full"
      style={{
        left: "-18%", top: "-22%",
        width: "72%", height: "72%",
        background: "hsl(20, 86%, 52%)",
        filter: "blur(88px)",
        opacity: 0.30,
      }}
      animate={{ x: [0, 22, -10, 22, 0], y: [0, 16, -8, 16, 0] }}
      transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Deep navy-blue — bottom-right anchor */}
    <motion.div
      className="absolute rounded-full"
      style={{
        right: "-22%", bottom: "-28%",
        width: "78%", height: "78%",
        background: "hsl(226, 72%, 42%)",
        filter: "blur(100px)",
        opacity: 0.35,
      }}
      animate={{ x: [0, -18, 9, -18, 0], y: [0, -14, 7, -14, 0] }}
      transition={{ duration: 36, repeat: Infinity, ease: "easeInOut", delay: 6 }}
    />

    {/* Warm amber — faint center bloom */}
    <motion.div
      className="absolute rounded-full"
      style={{
        left: "18%", top: "28%",
        width: "60%", height: "60%",
        background: "hsl(34, 94%, 58%)",
        filter: "blur(112px)",
        opacity: 0.11,
      }}
      animate={{ scale: [1, 1.10, 0.92, 1.10, 1], x: [0, 12, -6, 12, 0] }}
      transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 12 }}
    />

    {/* Vignette — dark ring around card area for readability */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 68% 62% at 50% 50%, transparent 22%, hsl(228,61%,8%) 80%)",
      }}
    />

    {/* Subtle grain texture */}
    <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <filter id="qbg-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#qbg-grain)" />
    </svg>
  </div>
);

export default QuizBackground;
