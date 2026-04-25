import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { useSound } from "@/hooks/useSound";
import { useLang } from "@/i18n/LanguageContext";

interface SuccessScreenProps {
  email: string;
  userName: string;
  productName: string;
  onRestart: () => void;
}

// Paper airplane SVG component
const PaperAirplane = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path
      d="M4 4L28 16L4 28V18L20 16L4 14V4Z"
      fill="hsl(var(--primary))"
      stroke="hsl(var(--primary))"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

// Envelope SVG component
const EnvelopeIcon = () => (
  <svg width="120" height="90" viewBox="0 0 120 90" fill="none">
    {/* Envelope body */}
    <rect x="4" y="10" width="112" height="76" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2.5" />
    {/* Envelope flap */}
    <path d="M4 18 L60 55 L116 18" stroke="hsl(var(--border))" strokeWidth="2.5" strokeLinejoin="round" fill="hsl(var(--card))" />
    {/* Inner flap shadow */}
    <path d="M4 18 L60 55 L116 18" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeLinejoin="round" fill="none" opacity="0.15" />
    {/* Seal circle */}
    <circle cx="60" cy="58" r="12" fill="hsl(var(--primary))" opacity="0.9" />
    <path d="M54 58L58 62L66 54" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Flying paper airplane — loops 3 times then stops (avoids infinite GPU load on kiosk iPad)
const FlyingAirplane = ({ delay, id }: { delay: number; id: number }) => {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  const paths = [
    { startX: -60, startY: -100, midX: 80, midY: -60 },
    { startX: 400, startY: -80, midX: 200, midY: -50 },
    { startX: -80, startY: 80, midX: 100, midY: 20 },
    { startX: 420, startY: 60, midX: 220, midY: 10 },
  ];
  const p = paths[id % paths.length];

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ left: "50%", top: "50%", marginLeft: -16, marginTop: -40 }}
      initial={{ x: p.startX, y: p.startY, opacity: 0, rotate: 0, scale: 0.8 }}
      animate={{
        x: [p.startX, p.midX, 0],
        y: [p.startY, p.midY, 0],
        opacity: [0, 1, 1, 0],
        rotate: [p.startX > 200 ? 180 : -30, p.startX > 200 ? 120 : 10, p.startX > 200 ? 90 : 30],
        scale: [0.8, 1, 0.3],
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: 2,
        repeatDelay: 6,
        ease: "easeInOut",
        times: [0, 0.6, 1],
      }}
    >
      <PaperAirplane />
    </motion.div>
  );
};

const SuccessScreen = ({ email, userName, productName, onRestart }: SuccessScreenProps) => {
  const checkScale = useMotionValue(0);
  const checkOpacity = useTransform(checkScale, [0, 1], [0, 1]);
  const { play } = useSound();
  const { t } = useLang();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    animate(checkScale, 1, { type: "spring", stiffness: 200, damping: 15, delay: 0.5 });
    const timer = setTimeout(() => play("success"), 400);
    return () => clearTimeout(timer);
  }, []);

  const benefits = [
    { icon: "🎬", title: t.success.benefits.video.title, desc: t.success.benefits.video.desc, highlight: false },
    { icon: "📖", title: t.success.benefits.manual.title, desc: t.success.benefits.manual.desc, highlight: false },
    { icon: "❓", title: t.success.benefits.faq.title, desc: t.success.benefits.faq.desc, highlight: false },
    { icon: "🏷️", title: t.success.benefits.discount.title, desc: t.success.benefits.discount.desc, highlight: true },
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Subtle background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 35%, hsl(var(--primary) / 0.08) 0%, transparent 55%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
      >
        {/* Envelope area with flying airplanes */}
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 160 }}>
          {/* Flying paper airplanes */}
          <FlyingAirplane delay={0.5} id={0} />
          <FlyingAirplane delay={3} id={1} />
          <FlyingAirplane delay={5.5} id={2} />
          <FlyingAirplane delay={8} id={3} />

          {/* Main envelope */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative"
          >
            <EnvelopeIcon />

            {/* Subtle pulse ring around envelope — 3 pulses then stops */}
            {!reduceMotion && (
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ border: "2px solid hsl(var(--primary))" }}
                animate={{ scale: [1, 1.3, 1.5], opacity: [0.4, 0.1, 0] }}
                transition={{ duration: 2.5, repeat: 2, delay: 1.5 }}
              />
            )}
          </motion.div>
        </div>

        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-foreground">
            {userName ? t.success.title(userName) : t.success.titleNoName}
          </h2>
          <p className="mt-1 text-lg font-semibold text-gradient">{productName}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.success.productOnWay}
          </p>
        </motion.div>

        {/* Email card */}
        <motion.div
          className="w-full overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="gradient-primary px-4 py-2">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary-foreground">
              {t.success.recipient}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-center font-mono text-sm text-foreground">{email}</p>
          </div>
        </motion.div>

        {/* Benefits grid */}
        <motion.div
          className="grid w-full grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          {benefits.map((item, i) => (
            <motion.div
              key={i}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-4 backdrop-blur-sm ${
                item.highlight
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border bg-card/60"
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className={`text-xs font-bold ${item.highlight ? "text-primary" : "text-foreground"}`}>
                {item.title}
              </span>
              <span className="text-center text-[10px] text-muted-foreground">{item.desc}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          className="text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {t.success.spamNote}
        </motion.p>

        <motion.button
          onClick={onRestart}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-4 text-lg font-bold text-primary-foreground transition-transform active:scale-95"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          {t.success.restart}
        </motion.button>

        <motion.p
          className="text-[10px] text-muted-foreground/40 select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          © {new Date().getFullYear()} Webidoo · Webi-Match
        </motion.p>
      </motion.div>
    </div>
  );
};

export default SuccessScreen;
