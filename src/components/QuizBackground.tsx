import { motion } from "framer-motion";

// `circle closest-side` makes the gradient reach full transparency exactly at the
// div edge, so no hard rectangular boundary is visible in any browser.
const QuizBackground = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">

    {/* Orb 1 — orange (Webidoo primary), top-left */}
    <motion.div
      className="absolute"
      style={{
        left: "-20%", top: "-28%",
        width: "82%", height: "82%",
        background: "radial-gradient(circle closest-side, hsl(18,92%,58%) 0%, transparent 100%)",
        opacity: 0.55,
        willChange: "transform",
      }}
      animate={{ x: [0, 48, -22, 38, 0], y: [0, 32, -18, 42, 0], scale: [1, 1.14, 0.90, 1.10, 1] }}
      transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Orb 2 — bright blue (Webidoo navy), bottom-right */}
    <motion.div
      className="absolute"
      style={{
        right: "-22%", bottom: "-30%",
        width: "84%", height: "84%",
        background: "radial-gradient(circle closest-side, hsl(224,80%,54%) 0%, transparent 100%)",
        opacity: 0.52,
        willChange: "transform",
      }}
      animate={{ x: [0, -42, 18, -36, 0], y: [0, -28, 16, -38, 0], scale: [1, 0.88, 1.16, 0.94, 1] }}
      transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 5 }}
    />

    {/* Orb 3 — amber, center drift */}
    <motion.div
      className="absolute"
      style={{
        left: "10%", top: "22%",
        width: "68%", height: "68%",
        background: "radial-gradient(circle closest-side, hsl(38,96%,62%) 0%, transparent 100%)",
        opacity: 0.30,
        willChange: "transform",
      }}
      animate={{ x: [0, 36, -28, 44, 0], y: [0, -30, 22, -20, 0], scale: [1, 1.18, 0.86, 1.12, 1] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 10 }}
    />

    {/* Vignette — static, zero GPU cost */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 78% 72% at 50% 50%, transparent 30%, hsl(228,61%,9%,0.72) 92%)",
      }}
    />
  </div>
);

export default QuizBackground;
