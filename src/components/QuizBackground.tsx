import { motion } from "framer-motion";

// Webidoo liquid-gradient background — vivid orbs with larger movement.
const QuizBackground = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">

    {/* Orb 1 — vivid orange (Webidoo primary), top-left */}
    <motion.div
      className="absolute rounded-full"
      style={{
        left: "-20%", top: "-28%",
        width: "80%", height: "80%",
        background: "hsl(18, 92%, 58%)",
        filter: "blur(72px)",
        opacity: 0.52,
      }}
      animate={{
        x:     [0, 48, -22, 38, 0],
        y:     [0, 32, -18, 42, 0],
        scale: [1, 1.14, 0.90, 1.10, 1],
      }}
      transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Orb 2 — bright blue (Webidoo navy lifted), bottom-right */}
    <motion.div
      className="absolute rounded-full"
      style={{
        right: "-22%", bottom: "-30%",
        width: "82%", height: "82%",
        background: "hsl(224, 80%, 54%)",
        filter: "blur(80px)",
        opacity: 0.50,
      }}
      animate={{
        x:     [0, -42, 18, -36, 0],
        y:     [0, -28, 16, -38, 0],
        scale: [1, 0.88, 1.16, 0.94, 1],
      }}
      transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 5 }}
    />

    {/* Orb 3 — warm amber, center-left drift */}
    <motion.div
      className="absolute rounded-full"
      style={{
        left: "10%", top: "22%",
        width: "65%", height: "65%",
        background: "hsl(38, 96%, 62%)",
        filter: "blur(90px)",
        opacity: 0.28,
      }}
      animate={{
        x:     [0, 36, -28, 44, 0],
        y:     [0, -30, 22, -20, 0],
        scale: [1, 1.18, 0.86, 1.12, 1],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 10 }}
    />

    {/* Light vignette — only softens edges, keeps center alive */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 78% 72% at 50% 50%, transparent 30%, hsl(228,61%,9%,0.72) 92%)",
      }}
    />

    {/* Grain */}
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
