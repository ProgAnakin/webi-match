import { motion, AnimatePresence } from "framer-motion";

interface QuizBackgroundProps {
  emoji: string;
  category: string;
}

const categoryColors: Record<string, string> = {
  sport:        "hsl(145, 80%, 42%)",  // green  — athletic/movement
  audio:        "hsl(280, 70%, 55%)",  // purple — music/sound
  productivity: "hsl(200, 80%, 50%)",  // blue   — work/efficiency
  wellness:     "hsl(160, 70%, 50%)",  // teal   — self-care/health
  travel:       "hsl(190, 85%, 50%)",  // cyan   — on-the-go
  tech:         "hsl(240, 75%, 60%)",  // indigo — smart gadgets
  style:        "hsl(335, 80%, 60%)",  // rose   — design/aesthetics
  recovery:     "hsl(260, 65%, 55%)",  // violet — rest/sleep
};

const QuizBackground = ({ emoji, category }: QuizBackgroundProps) => {
  const color = categoryColors[category] || "hsl(27, 92%, 55%)";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Main color orb */}
      <AnimatePresence mode="wait">
        <motion.div
          key={category}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 500,
            height: 500,
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            filter: "blur(80px)",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.15, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.6 }}
        />
      </AnimatePresence>

      {/* Floating emojis */}
      <AnimatePresence mode="wait">
        <motion.div
          key={emoji}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl"
              style={{
                left: `${10 + (i * 12) % 85}%`,
                top: `${15 + ((i * 17 + 5) % 70)}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.3, 0],
                scale: [0.5, 1.2, 0.5],
                y: [0, -30, 0],
                rotate: [0, i % 2 === 0 ? 20 : -20, 0],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut",
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Subtle pulse rings */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ borderColor: color }}
          animate={{
            width: [100, 300 + ring * 80],
            height: [100, 300 + ring * 80],
            opacity: [0.2, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: ring * 0.8,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

export default QuizBackground;
