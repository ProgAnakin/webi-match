import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import type { Question } from "@/data/questions";
import { useLang } from "@/i18n/LanguageContext";

interface SwipeCardProps {
  question: Question;
  onSwipe: (direction: "left" | "right") => void;
  exitDirection?: "left" | "right";
}

const CATEGORY_COLORS: Record<string, string> = {
  sport:        "hsl(145, 80%, 42%)",
  audio:        "hsl(280, 70%, 55%)",
  productivity: "hsl(200, 80%, 50%)",
  wellness:     "hsl(160, 70%, 50%)",
  travel:       "hsl(190, 85%, 50%)",
  tech:         "hsl(240, 75%, 60%)",
  style:        "hsl(335, 80%, 60%)",
  recovery:     "hsl(260, 65%, 55%)",
};

const CATEGORY_LABELS: Record<string, string> = {
  sport:        "Sport",
  audio:        "Audio",
  productivity: "Produttività",
  wellness:     "Benessere",
  travel:       "Viaggio",
  tech:         "Tech",
  style:        "Stile",
  recovery:     "Recupero",
};

const SwipeCard = ({ question, onSwipe, exitDirection }: SwipeCardProps) => {
  const { t } = useLang();
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-22, 22]);
  const noOpacity  = useTransform(x, [-180, -60, 0], [1, 0.4, 0]);
  const yesOpacity = useTransform(x, [0, 60, 180], [0, 0.4, 1]);

  const accentColor = CATEGORY_COLORS[question.category] ?? "hsl(27, 92%, 55%)";
  const categoryLabel = CATEGORY_LABELS[question.category] ?? question.category;

  // Sync exit direction triggered by action buttons
  useEffect(() => {
    if (exitDirection === "right") setExitX(450);
    else if (exitDirection === "left") setExitX(-450);
  }, [exitDirection]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    // Velocity-aware threshold: fast flick needs less distance
    const velocityBoost = Math.abs(info.velocity.x) > 400 ? 30 : 0;
    const threshold = 90 - velocityBoost;

    if (info.offset.x > threshold) {
      setExitX(450);
      onSwipe("right");
    } else if (info.offset.x < -threshold) {
      setExitX(-450);
      onSwipe("left");
    }
  };

  return (
    <div className="relative flex h-[420px] w-full max-w-sm items-center justify-center">

      {/* NO label */}
      <motion.div
        className="pointer-events-none absolute left-5 top-8 z-20 flex items-center gap-2 rounded-2xl border-[3px] border-destructive/80 bg-destructive/15 px-4 py-2 backdrop-blur-sm"
        style={{ opacity: noOpacity, rotate: -14 }}
      >
        <span className="text-xl font-black text-destructive">✕</span>
        <span className="text-xl font-black tracking-wide text-destructive">{t.swipe.no}</span>
      </motion.div>

      {/* YES label */}
      <motion.div
        className="pointer-events-none absolute right-5 top-8 z-20 flex items-center gap-2 rounded-2xl border-[3px] border-success/80 bg-success/15 px-4 py-2 backdrop-blur-sm"
        style={{ opacity: yesOpacity, rotate: 14 }}
      >
        <span className="text-xl font-black tracking-wide text-success">{t.swipe.yes}</span>
        <span className="text-xl font-black text-success">✓</span>
      </motion.div>

      {/* Card */}
      <motion.div
        className="gradient-card shadow-card absolute flex h-full w-full cursor-grab flex-col overflow-hidden rounded-3xl border border-border/80 active:cursor-grabbing"
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.65}
        dragTransition={{ bounceStiffness: 480, bounceDamping: 38 }}
        onDragEnd={handleDragEnd}
        initial={{ scale: 0.86, opacity: 0, y: 48 }}
        animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
        exit={{
          x: exitX,
          opacity: 0,
          rotate: exitX > 0 ? 18 : -18,
          transition: { duration: 0.26, ease: "easeIn" },
        }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        whileDrag={{ scale: 1.025 }}
      >
        {/* Colored top accent bar */}
        <div
          className="h-1 w-full flex-shrink-0"
          style={{ background: accentColor }}
        />

        {/* Category chip */}
        <div className="flex justify-center pt-5">
          <span
            className="rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest"
            style={{
              color: accentColor,
              background: `${accentColor}1A`,
              border: `1px solid ${accentColor}40`,
            }}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Emoji — vertically centered in remaining space */}
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            className="text-[96px] leading-none select-none"
            animate={{ scale: [1, 1.07, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            {question.emoji}
          </motion.div>
        </div>

        {/* Question text */}
        <div className="px-7 pb-8 text-center">
          <h2 className="text-[1.35rem] font-bold leading-snug text-foreground">
            {t.questions[question.id] ?? question.text}
          </h2>
        </div>
      </motion.div>
    </div>
  );
};

export default SwipeCard;
