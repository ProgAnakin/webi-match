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

function haptic(ms: number) {
  try { navigator.vibrate?.(ms); } catch { /* unsupported */ }
}

const Pip = ({ color }: { color: string }) => (
  <div style={{ width: 7, height: 7, background: color, opacity: 0.35, transform: "rotate(45deg)" }} />
);

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
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const noOpacity  = useTransform(x, [-160, -50, 0], [1, 0.3, 0]);
  const yesOpacity = useTransform(x, [0, 50, 160], [0, 0.3, 1]);
  const cardShadow = useTransform(x, [-160, 0, 160], [
    "0 24px 60px hsl(0 84% 60% / 0.50)",
    "0 24px 60px hsl(0 0% 0% / 0.45)",
    "0 24px 60px hsl(145 80% 42% / 0.50)",
  ]);

  const accentColor   = CATEGORY_COLORS[question.category]  ?? "hsl(27, 92%, 55%)";
  const categoryLabel = CATEGORY_LABELS[question.category]  ?? question.category;
  const categoryCode  = CATEGORY_CODES[question.category]   ?? "???";
  const roman         = ROMAN[index] ?? String(index + 1);
  const romanTotal    = ROMAN[questions.length - 1] ?? String(questions.length);

  // Drag tint overlays — red on left drag, green on right drag
  const noTintOpacity  = useTransform(x, [-140, -40, 0], [0.28, 0.08, 0]);
  const yesTintOpacity = useTransform(x, [0, 40, 140], [0, 0.08, 0.28]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const velocityBoost = Math.abs(info.velocity.x) > 400 ? 30 : 0;
    const threshold = 85 - velocityBoost;
    if (info.offset.x > threshold)       { haptic(45); onSwipe("right"); }
    else if (info.offset.x < -threshold) { haptic(30); onSwipe("left");  }
  };

  return (
    <div className="relative flex h-[620px] w-full max-w-[375px] items-center justify-center">

      {/* Static stack peeks — pure CSS, no animation */}
      <div className="gradient-card absolute h-full w-full rounded-3xl border border-border/25"
        style={{ transform: "scale(0.84) translateY(40px)", opacity: 0.18, zIndex: -1 }} />
      <div className="gradient-card absolute h-full w-full rounded-3xl border border-border/30"
        style={{ transform: "scale(0.92) translateY(18px)", opacity: 0.40, zIndex: 0 }} />

      {/* NO / YES labels — only visible during drag */}
      <motion.div
        className="pointer-events-none absolute left-4 top-10 z-20 flex items-center gap-2 rounded-2xl border-[3px] border-destructive/80 bg-destructive/15 px-4 py-2"
        style={{ opacity: noOpacity, rotate: -12 }}
      >
        <span className="text-xl font-black text-destructive">✕</span>
        <span className="text-xl font-black tracking-wide text-destructive">{t.swipe.no}</span>
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-4 top-10 z-20 flex items-center gap-2 rounded-2xl border-[3px] border-success/80 bg-success/15 px-4 py-2"
        style={{ opacity: yesOpacity, rotate: 12 }}
      >
        <span className="text-xl font-black tracking-wide text-success">{t.swipe.yes}</span>
        <span className="text-xl font-black text-success">✓</span>
      </motion.div>

      {/* ── CARD ── */}
      <motion.div
        className="gradient-card absolute flex h-full w-full cursor-grab flex-col overflow-hidden rounded-3xl border border-white/10 active:cursor-grabbing"
        style={{ x, rotate, boxShadow: cardShadow, zIndex: 1 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.55}
        dragTransition={{ bounceStiffness: 200, bounceDamping: 28 }}
        onDragEnd={handleDragEnd}
        // No entry animation — card is instantly present like Tinder
        initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={{
          x: exitDirection === "right" ? 480 : -480,
          rotate: exitDirection === "right" ? 18 : -18,
          opacity: 0,
          transition: { duration: 0.26, ease: [0.32, 0, 0.67, 0] },
        }}
        whileDrag={{ scale: 1.015 }}
      >
        {/* Accent bar */}
        <div className="relative z-30 h-[3px] w-full flex-shrink-0" style={{ background: accentColor }} />

        {/* Drag tint overlays */}
        <motion.div className="pointer-events-none absolute inset-0 z-25 rounded-3xl"
          style={{ background: "hsl(0 84% 60%)", opacity: noTintOpacity }} />
        <motion.div className="pointer-events-none absolute inset-0 z-25 rounded-3xl"
          style={{ background: "hsl(145 80% 42%)", opacity: yesTintOpacity }} />

        {/* Side edge highlights */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-30 w-[2px]"
          style={{ background: `linear-gradient(to bottom, transparent 8%, ${accentColor}60 40%, ${accentColor}30 65%, transparent 92%)` }} />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-30 w-[2px]"
          style={{ background: `linear-gradient(to bottom, transparent 8%, ${accentColor}60 40%, ${accentColor}30 65%, transparent 92%)` }} />

        {/* Inner frame */}
        <div className="pointer-events-none absolute inset-[10px] z-20 rounded-[22px] border"
          style={{ borderColor: `${accentColor}18` }} />
        <div className="pointer-events-none absolute left-[14px] top-[14px] z-20"><Pip color={accentColor} /></div>
        <div className="pointer-events-none absolute right-[14px] top-[14px] z-20"><Pip color={accentColor} /></div>
        <div className="pointer-events-none absolute left-[14px] bottom-[14px] z-20"><Pip color={accentColor} /></div>
        <div className="pointer-events-none absolute right-[14px] bottom-[14px] z-20"><Pip color={accentColor} /></div>

        {/* Gradients */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{ background: `linear-gradient(to bottom, ${accentColor}28, transparent)` }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-52"
          style={{ background: "linear-gradient(to top, hsl(0 0% 0% / 0.78) 0%, transparent 100%)" }} />

        {/* Diagonal texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.032]"
          style={{ backgroundImage: `repeating-linear-gradient(45deg, ${accentColor} 0px, ${accentColor} 1px, transparent 1px, transparent 22px)` }} />

        {/* Top-left corner */}
        <div className="absolute left-5 top-6 z-30 flex flex-col items-center gap-0.5">
          <span className="text-[17px] font-black leading-none tracking-tight"
            style={{ color: accentColor, fontFamily: "Georgia, serif" }}>{roman}</span>
          <div className="h-px w-5" style={{ background: accentColor, opacity: 0.4 }} />
          <span className="text-[8px] font-bold tracking-[0.22em]"
            style={{ color: accentColor, opacity: 0.55 }}>{categoryCode}</span>
        </div>

        {/* Top-right corner (mirrored) */}
        <div className="absolute right-5 top-6 z-30 flex flex-col items-center gap-0.5"
          style={{ transform: "rotate(180deg)" }}>
          <span className="text-[17px] font-black leading-none tracking-tight"
            style={{ color: accentColor, fontFamily: "Georgia, serif" }}>{roman}</span>
          <div className="h-px w-5" style={{ background: accentColor, opacity: 0.4 }} />
          <span className="text-[8px] font-bold tracking-[0.22em]"
            style={{ color: accentColor, opacity: 0.55 }}>{categoryCode}</span>
        </div>

        {/* Category badge */}
        <div className="relative z-30 flex justify-center pt-7">
          <div className="flex items-center gap-2.5 px-5 py-1.5"
            style={{ background: `${accentColor}14`, border: `1px solid ${accentColor}40`, borderRadius: "4px" }}>
            <div style={{ width: 5, height: 5, background: accentColor, opacity: 0.8, transform: "rotate(45deg)", flexShrink: 0 }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: accentColor }}>
              {categoryLabel}
            </span>
            <div style={{ width: 5, height: 5, background: accentColor, opacity: 0.8, transform: "rotate(45deg)", flexShrink: 0 }} />
          </div>
        </div>

        {/* Art zone */}
        <div className="relative flex flex-1 flex-col">
          <div className="mt-4 mb-2"><CardDivider color={accentColor} /></div>

          {/* Emoji — static, no animation */}
          <div className="relative flex flex-1 items-center justify-center">
            {/* Static glow */}
            <div className="pointer-events-none absolute rounded-full"
              style={{ background: accentColor, width: 180, height: 180, filter: "blur(60px)", opacity: 0.18 }} />
            <span className="relative z-10 select-none" style={{ display: "block", fontSize: "118px", lineHeight: 1 }}>
              {question.emoji}
            </span>
          </div>

          <div className="mt-2 mb-3"><CardDivider color={accentColor} /></div>
        </div>

        {/* Question text */}
        <div className="relative z-20 px-7 pt-1 pb-8 text-center">
          <h2 className="text-[1.2rem] font-bold leading-snug text-white"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.95)" }}>
            {t.questions[question.id] ?? question.text}
          </h2>
        </div>

        {/* Bottom-left corner */}
        <div className="absolute bottom-6 left-5 z-30 flex flex-col-reverse items-center gap-0.5"
          style={{ transform: "rotate(180deg)" }}>
          <span className="text-[17px] font-black leading-none tracking-tight"
            style={{ color: accentColor, fontFamily: "Georgia, serif" }}>{roman}</span>
          <div className="h-px w-5" style={{ background: accentColor, opacity: 0.4 }} />
          <span className="text-[8px] font-bold tracking-[0.22em]"
            style={{ color: accentColor, opacity: 0.55 }}>{categoryCode}</span>
        </div>

        {/* Bottom-right: Roman progress */}
        <div className="absolute bottom-6 right-5 z-30 flex items-baseline gap-0.5">
          <span className="text-[13px] font-black leading-none"
            style={{ color: accentColor, fontFamily: "Georgia, serif" }}>{roman}</span>
          <span className="text-[10px] font-bold leading-none"
            style={{ color: accentColor, opacity: 0.4, fontFamily: "Georgia, serif" }}>/{romanTotal}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default SwipeCard;
