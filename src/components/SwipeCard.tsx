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
  fitness:      "hsl(145, 80%, 42%)",
  camera:       "hsl(45, 90%, 55%)",
  gaming:       "hsl(330, 75%, 55%)",
  communication:"hsl(210, 80%, 55%)",
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
  fitness:      "Fitness",
  camera:       "Foto",
  gaming:       "Gaming",
  communication:"Chat",
};

// Slam-in from above with rotation overshoot — charismatic entry
const cardVariants = {
  initial: { scale: 0.45, opacity: 0, y: -200, rotate: 12 },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    x: 0,
    rotate: 0,
    transition: {
      scale:  { type: "spring" as const, stiffness: 480, damping: 18, mass: 0.9 },
      opacity: { duration: 0.06 },
      y:      { type: "spring" as const, stiffness: 500, damping: 20, mass: 0.85 },
      rotate: { type: "spring" as const, stiffness: 360, damping: 14, mass: 0.8 },
    },
  },
  // Violent throw — fast rotation + downward arc
  exit: (direction: "left" | "right" | undefined) => ({
    x: direction === "right" ? 750 : -750,
    y: 80,
    opacity: 0,
    rotate: direction === "right" ? 44 : -44,
    scale: 0.70,
    transition: {
      duration: 0.22,
      ease: [0.65, 0, 0.95, 0.45] as [number, number, number, number],
    },
  }),
};

function haptic(ms: number) {
  try { navigator.vibrate?.(ms); } catch { /* unsupported — silent */ }
}

const SwipeCard = ({ question, onSwipe, exitDirection }: SwipeCardProps) => {
  const { t } = useLang();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-22, 22]);
  const noOpacity  = useTransform(x, [-180, -60, 0], [1, 0.4, 0]);
  const yesOpacity = useTransform(x, [0, 60, 180], [0, 0.4, 1]);

  const cardShadow = useTransform(
    x,
    [-180, 0, 180],
    [
      "0 28px 80px hsl(0 84% 60% / 0.58), -12px 0 36px hsl(0 84% 60% / 0.34)",
      "0 28px 80px hsl(0 0% 0% / 0.48)",
      "0 28px 80px hsl(145 80% 42% / 0.58), 12px 0 36px hsl(145 80% 42% / 0.34)",
    ],
  );

  const accentColor = CATEGORY_COLORS[question.category] ?? "hsl(27, 92%, 55%)";
  const categoryLabel = CATEGORY_LABELS[question.category] ?? question.category;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const velocityBoost = Math.abs(info.velocity.x) > 400 ? 30 : 0;
    const threshold = 90 - velocityBoost;

    if (info.offset.x > threshold) {
      haptic(45);
      onSwipe("right");
    } else if (info.offset.x < -threshold) {
      haptic(30);
      onSwipe("left");
    }
  };

  return (
    <div className="relative flex h-[500px] w-full max-w-[300px] items-center justify-center">

      {/* Second stack peek (deepest) */}
      <div
        className="gradient-card absolute h-full w-full rounded-3xl border border-border/30"
        style={{ transform: "scale(0.84) translateY(36px)", opacity: 0.22, zIndex: -1 }}
      />

      {/* First stack peek */}
      <div
        className="gradient-card absolute h-full w-full rounded-3xl border border-border/40"
        style={{ transform: "scale(0.92) translateY(18px)", opacity: 0.46, zIndex: 0 }}
      />

      {/* NO label */}
      <motion.div
        className="pointer-events-none absolute left-4 top-10 z-20 flex items-center gap-2 rounded-2xl border-[3px] border-destructive/80 bg-destructive/15 px-4 py-2 backdrop-blur-sm"
        style={{ opacity: noOpacity, rotate: -14 }}
      >
        <span className="text-xl font-black text-destructive">✕</span>
        <span className="text-xl font-black tracking-wide text-destructive">{t.swipe.no}</span>
      </motion.div>

      {/* YES label */}
      <motion.div
        className="pointer-events-none absolute right-4 top-10 z-20 flex items-center gap-2 rounded-2xl border-[3px] border-success/80 bg-success/15 px-4 py-2 backdrop-blur-sm"
        style={{ opacity: yesOpacity, rotate: 14 }}
      >
        <span className="text-xl font-black tracking-wide text-success">{t.swipe.yes}</span>
        <span className="text-xl font-black text-success">✓</span>
      </motion.div>

      {/* Card */}
      <motion.div
        className="gradient-card absolute flex h-full w-full cursor-grab flex-col overflow-hidden rounded-3xl border border-border/70 active:cursor-grabbing"
        style={{ x, rotate, boxShadow: cardShadow, zIndex: 1 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.65}
        dragTransition={{ bounceStiffness: 480, bounceDamping: 38 }}
        onDragEnd={handleDragEnd}
        custom={exitDirection}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        whileDrag={{ scale: 1.02 }}
      >
        {/* Top category-colored gradient wash */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{ background: `linear-gradient(to bottom, ${accentColor}30, transparent)` }}
        />

        {/* Bottom dark gradient — ensures text legibility */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44"
          style={{ background: "linear-gradient(to top, hsl(0 0% 0% / 0.72) 0%, transparent 100%)" }}
        />

        {/* Colored top accent bar */}
        <div className="relative z-20 h-1.5 w-full flex-shrink-0" style={{ background: accentColor }} />

        {/* Category chip */}
        <div className="relative z-20 flex justify-center pt-5">
          <span
            className="rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-widest"
            style={{
              color: accentColor,
              background: `${accentColor}22`,
              border: `1px solid ${accentColor}55`,
            }}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Emoji area — flex-1 so it fills the middle */}
        <div className="relative flex flex-1 items-center justify-center">
          {/* Breathing glow orb behind emoji */}
          <motion.div
            className="pointer-events-none absolute rounded-full"
            style={{ background: accentColor, width: 180, height: 180, filter: "blur(60px)" }}
            animate={{ opacity: [0.10, 0.28, 0.10], scale: [0.85, 1.12, 0.85] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Emoji: rubber-band pop-in, then gentle float loop */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 10, mass: 0.65, delay: 0.1 }}
          >
            <motion.span
              className="select-none"
              style={{ display: "block", fontSize: "100px", lineHeight: 1 }}
              animate={{
                scale:  [1, 1.07, 0.97, 1.04, 1],
                rotate: [0, 3, -2, 1.5, 0],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
            >
              {question.emoji}
            </motion.span>
          </motion.div>
        </div>

        {/* Question text — sits above the dark gradient */}
        <div className="relative z-20 px-6 pb-7 pt-3 text-center">
          <h2
            className="text-[1.15rem] font-bold leading-snug text-white"
            style={{ textShadow: "0 1px 10px rgba(0,0,0,0.9)" }}
          >
            {t.questions[question.id] ?? question.text}
          </h2>
        </div>
      </motion.div>
    </div>
  );
};

export default SwipeCard;
