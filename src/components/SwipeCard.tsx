import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import type { Question } from "@/data/questions";
import { questions } from "@/data/questions";
import { useLang } from "@/i18n/LanguageContext";

interface SwipeCardProps {
  question: Question;
  onSwipe: (direction: "left" | "right") => void;
  exitDirection?: "left" | "right";
  index?: number;
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

// 3-letter codes for corner labels (no emoji)
const CATEGORY_CODES: Record<string, string> = {
  sport:        "SPT",
  audio:        "AUD",
  productivity: "PRD",
  wellness:     "WLS",
  travel:       "TRV",
  tech:         "TCH",
  style:        "STL",
  recovery:     "RCV",
  fitness:      "FIT",
  camera:       "CAM",
  gaming:       "GMG",
  communication:"COM",
};

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];

const cardVariants = {
  initial: { scale: 0.45, opacity: 0, y: -200, rotate: 12 },
  animate: {
    scale: 1, opacity: 1, y: 0, x: 0, rotate: 0,
    transition: {
      scale:   { type: "spring" as const, stiffness: 480, damping: 18, mass: 0.9 },
      opacity: { duration: 0.06 },
      y:       { type: "spring" as const, stiffness: 500, damping: 20, mass: 0.85 },
      rotate:  { type: "spring" as const, stiffness: 360, damping: 14, mass: 0.8 },
    },
  },
  exit: (direction: "left" | "right" | undefined) => ({
    x: direction === "right" ? 520 : -520,
    y: 48,
    rotate: direction === "right" ? 22 : -22,
    scale: 0.92,
    opacity: 0,
    transition: {
      duration: 0.52,
      ease: [0.32, 0.14, 0.22, 1.0] as [number, number, number, number],
      opacity: { delay: 0.10, duration: 0.40, ease: "easeOut" as const },
    },
  }),
};

function haptic(ms: number) {
  try { navigator.vibrate?.(ms); } catch { /* unsupported */ }
}

// Decorative corner pip (rotated square — classic card ornament)
const Pip = ({ color }: { color: string }) => (
  <div style={{ width: 7, height: 7, background: color, opacity: 0.35, transform: "rotate(45deg)" }} />
);

// Triple-diamond divider — classic card art border
const CardDivider = ({ color }: { color: string }) => (
  <div className="mx-5 flex items-center gap-1.5">
    <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${color}55)` }} />
    <div style={{ width: 5, height: 5, background: color, opacity: 0.45, transform: "rotate(45deg)" }} />
    <div className="h-px w-3" style={{ background: color, opacity: 0.3 }} />
    <div style={{ width: 7, height: 7, background: color, opacity: 0.75, transform: "rotate(45deg)" }} />
    <div className="h-px w-3" style={{ background: color, opacity: 0.3 }} />
    <div style={{ width: 5, height: 5, background: color, opacity: 0.45, transform: "rotate(45deg)" }} />
    <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${color}55)` }} />
  </div>
);

const SwipeCard = ({ question, onSwipe, exitDirection, index = 0 }: SwipeCardProps) => {
  const { t } = useLang();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-22, 22]);
  const noOpacity  = useTransform(x, [-180, -60, 0], [1, 0.4, 0]);
  const yesOpacity = useTransform(x, [0, 60, 180], [0, 0.4, 1]);

  const cardShadow = useTransform(x, [-180, 0, 180], [
    "0 32px 90px hsl(0 84% 60% / 0.60), -14px 0 40px hsl(0 84% 60% / 0.36)",
    "0 32px 90px hsl(0 0% 0% / 0.52)",
    "0 32px 90px hsl(145 80% 42% / 0.60), 14px 0 40px hsl(145 80% 42% / 0.36)",
  ]);

  const accentColor   = CATEGORY_COLORS[question.category]  ?? "hsl(27, 92%, 55%)";
  const categoryLabel = CATEGORY_LABELS[question.category]  ?? question.category;
  const categoryCode  = CATEGORY_CODES[question.category]   ?? "???";
  const roman         = ROMAN[index] ?? String(index + 1);
  const romanTotal    = ROMAN[questions.length - 1] ?? String(questions.length);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const velocityBoost = Math.abs(info.velocity.x) > 400 ? 30 : 0;
    const threshold = 90 - velocityBoost;
    if (info.offset.x > threshold)       { haptic(45); onSwipe("right"); }
    else if (info.offset.x < -threshold) { haptic(30); onSwipe("left");  }
  };

  return (
    <div className="relative flex h-[620px] w-full max-w-[375px] items-center justify-center">

      {/* Stack peeks */}
      <div className="gradient-card absolute h-full w-full rounded-3xl border border-border/25"
        style={{ transform: "scale(0.84) translateY(40px)", opacity: 0.20, zIndex: -1 }} />
      <div className="gradient-card absolute h-full w-full rounded-3xl border border-border/35"
        style={{ transform: "scale(0.92) translateY(20px)", opacity: 0.44, zIndex: 0 }} />

      {/* NO / YES overlay labels */}
      <motion.div
        className="pointer-events-none absolute left-4 top-10 z-20 flex items-center gap-2 rounded-2xl border-[3px] border-destructive/80 bg-destructive/15 px-4 py-2 backdrop-blur-sm"
        style={{ opacity: noOpacity, rotate: -14 }}
      >
        <span className="text-xl font-black text-destructive">✕</span>
        <span className="text-xl font-black tracking-wide text-destructive">{t.swipe.no}</span>
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-4 top-10 z-20 flex items-center gap-2 rounded-2xl border-[3px] border-success/80 bg-success/15 px-4 py-2 backdrop-blur-sm"
        style={{ opacity: yesOpacity, rotate: 14 }}
      >
        <span className="text-xl font-black tracking-wide text-success">{t.swipe.yes}</span>
        <span className="text-xl font-black text-success">✓</span>
      </motion.div>

      {/* ── CARD ────────────────────────────────────────────────────── */}
      <motion.div
        className="gradient-card absolute flex h-full w-full cursor-grab flex-col overflow-hidden rounded-3xl border border-white/10 active:cursor-grabbing"
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
        {/* 3px accent bar */}
        <div className="relative z-30 h-[3px] w-full flex-shrink-0" style={{ background: accentColor }} />

        {/* Holographic strips — left & right edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-30 w-[2px]"
          style={{ background: `linear-gradient(to bottom, transparent 8%, ${accentColor}70 40%, ${accentColor}40 65%, transparent 92%)` }} />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-30 w-[2px]"
          style={{ background: `linear-gradient(to bottom, transparent 8%, ${accentColor}70 40%, ${accentColor}40 65%, transparent 92%)` }} />

        {/* Inner card frame */}
        <div className="pointer-events-none absolute inset-[10px] z-20 rounded-[22px] border"
          style={{ borderColor: `${accentColor}20` }} />

        {/* Inner frame corner pips (classic card ornament) */}
        <div className="pointer-events-none absolute left-[14px] top-[14px] z-20"><Pip color={accentColor} /></div>
        <div className="pointer-events-none absolute right-[14px] top-[14px] z-20"><Pip color={accentColor} /></div>
        <div className="pointer-events-none absolute left-[14px] bottom-[14px] z-20"><Pip color={accentColor} /></div>
        <div className="pointer-events-none absolute right-[14px] bottom-[14px] z-20"><Pip color={accentColor} /></div>

        {/* Top gradient wash */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{ background: `linear-gradient(to bottom, ${accentColor}32, transparent)` }} />

        {/* Bottom dark gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-52"
          style={{ background: "linear-gradient(to top, hsl(0 0% 0% / 0.80) 0%, transparent 100%)" }} />

        {/* Diagonal line texture — classic card feel */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.038]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${accentColor} 0px, ${accentColor} 1px, transparent 1px, transparent 22px)`,
          }} />

        {/* ── TOP-LEFT CORNER: Roman numeral + code ── */}
        <div className="absolute left-5 top-6 z-30 flex flex-col items-center gap-0.5">
          <span className="text-[17px] font-black leading-none tracking-tight"
            style={{ color: accentColor, fontFamily: "Georgia, serif" }}>
            {roman}
          </span>
          <div className="h-px w-5" style={{ background: accentColor, opacity: 0.4 }} />
          <span className="text-[8px] font-bold tracking-[0.22em]"
            style={{ color: accentColor, opacity: 0.55 }}>
            {categoryCode}
          </span>
        </div>

        {/* ── TOP-RIGHT CORNER: mirrored 180° ── */}
        <div className="absolute right-5 top-6 z-30 flex flex-col items-center gap-0.5"
          style={{ transform: "rotate(180deg)" }}>
          <span className="text-[17px] font-black leading-none tracking-tight"
            style={{ color: accentColor, fontFamily: "Georgia, serif" }}>
            {roman}
          </span>
          <div className="h-px w-5" style={{ background: accentColor, opacity: 0.4 }} />
          <span className="text-[8px] font-bold tracking-[0.22em]"
            style={{ color: accentColor, opacity: 0.55 }}>
            {categoryCode}
          </span>
        </div>

        {/* ── Category badge — rectangular, classic ── */}
        <div className="relative z-30 flex justify-center pt-7">
          <div className="flex items-center gap-2.5 px-5 py-1.5"
            style={{
              background: `${accentColor}16`,
              border: `1px solid ${accentColor}45`,
              borderRadius: "4px",
            }}>
            <div style={{ width: 5, height: 5, background: accentColor, opacity: 0.8, transform: "rotate(45deg)", flexShrink: 0 }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{ color: accentColor }}>
              {categoryLabel}
            </span>
            <div style={{ width: 5, height: 5, background: accentColor, opacity: 0.8, transform: "rotate(45deg)", flexShrink: 0 }} />
          </div>
        </div>

        {/* ── Art zone ── */}
        <div className="relative flex flex-1 flex-col">

          {/* Top triple-diamond divider */}
          <div className="mt-4 mb-2">
            <CardDivider color={accentColor} />
          </div>

          {/* Emoji + glow */}
          <div className="relative flex flex-1 items-center justify-center">
            <motion.div className="pointer-events-none absolute rounded-full"
              style={{ background: accentColor, width: 200, height: 200, filter: "blur(65px)" }}
              animate={{ opacity: [0.10, 0.30, 0.10], scale: [0.85, 1.12, 0.85] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div className="relative z-10"
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 10, mass: 0.65, delay: 0.1 }}
            >
              <motion.span className="select-none"
                style={{ display: "block", fontSize: "118px", lineHeight: 1 }}
                animate={{ scale: [1, 1.07, 0.97, 1.04, 1], rotate: [0, 3, -2, 1.5, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
              >
                {question.emoji}
              </motion.span>
            </motion.div>
          </div>

          {/* Bottom triple-diamond divider */}
          <div className="mt-2 mb-3">
            <CardDivider color={accentColor} />
          </div>
        </div>

        {/* ── Question text ── */}
        <div className="relative z-20 px-7 pt-1 pb-8 text-center">
          <h2 className="text-[1.2rem] font-bold leading-snug text-white"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.95)" }}>
            {t.questions[question.id] ?? question.text}
          </h2>
        </div>

        {/* ── BOTTOM-LEFT CORNER: mirrored ── */}
        <div className="absolute bottom-6 left-5 z-30 flex flex-col-reverse items-center gap-0.5"
          style={{ transform: "rotate(180deg)" }}>
          <span className="text-[17px] font-black leading-none tracking-tight"
            style={{ color: accentColor, fontFamily: "Georgia, serif" }}>
            {roman}
          </span>
          <div className="h-px w-5" style={{ background: accentColor, opacity: 0.4 }} />
          <span className="text-[8px] font-bold tracking-[0.22em]"
            style={{ color: accentColor, opacity: 0.55 }}>
            {categoryCode}
          </span>
        </div>

        {/* ── BOTTOM-RIGHT: Roman progress ── */}
        <div className="absolute bottom-6 right-5 z-30 flex items-baseline gap-0.5">
          <span className="text-[13px] font-black leading-none"
            style={{ color: accentColor, fontFamily: "Georgia, serif" }}>
            {roman}
          </span>
          <span className="text-[10px] font-bold leading-none"
            style={{ color: accentColor, opacity: 0.4, fontFamily: "Georgia, serif" }}>
            /{romanTotal}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default SwipeCard;
