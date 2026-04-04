import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import type { Question } from "@/data/questions";

interface SwipeCardProps {
  question: Question;
  onSwipe: (direction: "left" | "right") => void;
  exitDirection?: "left" | "right";
}

const SwipeCard = ({ question, onSwipe, exitDirection }: SwipeCardProps) => {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const noOpacity = useTransform(x, [-200, -80, 0], [1, 0.5, 0]);
  const yesOpacity = useTransform(x, [0, 80, 200], [0, 0.5, 1]);

  // Sync exit direction from parent (button press)
  useEffect(() => {
    if (exitDirection === "right") setExitX(400);
    else if (exitDirection === "left") setExitX(-400);
  }, [exitDirection]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      setExitX(400);
      onSwipe("right");
    } else if (info.offset.x < -100) {
      setExitX(-400);
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
        <span className="text-2xl font-bold text-destructive">NO</span>
      </motion.div>

      {/* YES overlay */}
      <motion.div
        className="pointer-events-none absolute right-4 top-6 z-20 flex items-center gap-2 rounded-2xl border-4 border-success/80 bg-success/10 px-5 py-2 backdrop-blur-sm"
        style={{ opacity: yesOpacity, rotate: 15 }}
      >
        <span className="text-2xl font-bold text-success">SÌ</span>
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
        initial={{ scale: 0.8, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
        exit={{ x: exitX, opacity: 0, rotate: exitX > 0 ? 20 : -20, transition: { duration: 0.3 } }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Emoji */}
        <motion.div
          className="mb-6 text-[120px] leading-none"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {question.emoji}
        </motion.div>

        {/* Question text */}
        <h2 className="text-center text-2xl font-bold text-foreground">
          {question.text}
        </h2>
      </motion.div>
    </div>
  );
};

export default SwipeCard;
