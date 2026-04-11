import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import type { Question } from "@/data/questions";
import { useLang } from "@/i18n/LanguageContext";

interface SwipeCardProps {
  question: Question;
  onSwipe: (direction: "left" | "right") => void;
  exitDirection?: "left" | "right";
}

// Direction is passed via `custom` so it's read synchronously at exit time,
// avoiding the stale-state "jump" that occurred when exitX was stored in useState.
const cardVariants = {
  initial: { scale: 0.92, opacity: 0, y: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    x: 0,
    transition: { type: "spring" as const, stiffness: 380, damping: 38 },
  },
  exit: (direction: "left" | "right" | undefined) => ({
    x: direction === "right" ? 480 : -480,
    opacity: 0,
    rotate: direction === "right" ? 20 : -20,
    transition: { duration: 0.28, ease: [0.32, 0, 0.67, 0] as [number, number, number, number] },
  }),
};

const SwipeCard = ({ question, onSwipe, exitDirection }: SwipeCardProps) => {
  const { t } = useLang();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const noOpacity = useTransform(x, [-200, -80, 0], [1, 0.5, 0]);
  const yesOpacity = useTransform(x, [0, 80, 200], [0, 0.5, 1]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
  };

  return (
    <div className="relative flex h-[380px] w-full max-w-sm items-center justify-center">
      {/* NO overlay */}
      <motion.div
        className="pointer-events-none absolute left-4 top-6 z-20 flex items-center gap-2 rounded-2xl border-4 border-destructive/80 bg-destructive/10 px-5 py-2 backdrop-blur-sm"
        style={{ opacity: noOpacity, rotate: -15 }}
      >
        <span className="text-2xl font-bold text-destructive">✕</span>
        <span className="text-2xl font-bold text-destructive">{t.swipe.no}</span>
      </motion.div>

      {/* YES overlay */}
      <motion.div
        className="pointer-events-none absolute right-4 top-6 z-20 flex items-center gap-2 rounded-2xl border-4 border-success/80 bg-success/10 px-5 py-2 backdrop-blur-sm"
        style={{ opacity: yesOpacity, rotate: 15 }}
      >
        <span className="text-2xl font-bold text-success">{t.swipe.yes}</span>
        <span className="text-2xl font-bold text-success">✓</span>
      </motion.div>

      {/* Card */}
      <motion.div
        className="gradient-card shadow-card absolute flex h-full w-full cursor-grab flex-col items-center justify-center rounded-3xl border border-border p-8 active:cursor-grabbing"
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        custom={exitDirection}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Emoji */}
        <motion.div
          className="mb-6 text-[120px] leading-none"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {question.emoji}
        </motion.div>

        {/* Question text — translated */}
        <h2 className="text-center text-2xl font-bold text-foreground">
          {t.questions[question.id] ?? question.text}
        </h2>
      </motion.div>
    </div>
  );
};

export default SwipeCard;
