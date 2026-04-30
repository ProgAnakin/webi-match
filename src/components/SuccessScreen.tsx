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

// ── Paper airplane SVG — nose points RIGHT ─────────────────────────────────
const Plane = ({ size = 38, opacity = 1 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 38 38" fill="none" style={{ opacity }}>
    <path d="M2 19 L36 5 L24 35 L17 25 Z" fill="white" />
    <path d="M2 19 L17 25" stroke="rgba(0,0,0,0.18)" strokeWidth="0.9" />
    <path d="M17 25 L24 35" stroke="rgba(0,0,0,0.18)" strokeWidth="0.9" />
    <path d="M2 19 L17 25 L19 19 Z" fill="rgba(0,0,0,0.10)" />
    <path d="M19 19 L36 5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
  </svg>
);

// Pre-computed sparkle positions — stable across renders
const SPARKLES = Array.from({ length: 22 }, (_, i) => ({
  id:    i,
  left:  `${4 + (i * 41 % 92)}%`,
  top:   `${4 + (i * 59 % 88)}%`,
  size:  1 + (i % 3) * 0.8,
  delay: (i * 0.43) % 6,
  dur:   2.0 + (i % 5) * 0.5,
}));

// ── Warm celebration background ──────────────────────────────────────────────
// 3 brand-aligned orbs (orange + amber + supporting blue-violet) drift gently
// with mix-blend-mode:screen for additive colour mixing. Anchored in the body
// base colour so transition from MatchResult feels like rising warmth, not a
// jump to a different visual universe.
const SuccessBackground = ({ skip }: { skip: boolean }) => (
  <div
    className="pointer-events-none absolute inset-0 overflow-hidden"
    style={{ background: "linear-gradient(160deg, hsl(230,55%,18%) 0%, hsl(228,55%,15%) 55%, hsl(232,55%,17%) 100%)" }}
  >
    {/* Warm sunlight burst — centre top, reinforces brand orange */}
    <div className="absolute inset-0"
      style={{ background: "radial-gradient(ellipse 70% 55% at 50% -5%, hsl(27,92%,62% / 0.28) 0%, transparent 70%)" }}
    />

    {/* Orb layer — screen blend for additive colour mixing */}
    <div className="absolute inset-0" style={{ mixBlendMode: "screen" }}>

      {/* Orb 1 — brand orange (hero), top-left */}
      <motion.div className="absolute rounded-full"
        style={{
          left: "-8%", top: "-8%",
          width: 760, height: 760,
          background: "radial-gradient(circle, hsl(27,92%,55%) 0%, transparent 65%)",
          filter: "blur(64px)", opacity: 0.54,
        }}
        animate={skip ? {} : { x: [0, 110, 190, 130, 40, -40, 0], y: [0, 70, -30, -110, -50, 50, 0] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb 2 — warm amber, bottom-right (continues the warm story) */}
      <motion.div className="absolute rounded-full"
        style={{
          right: "-12%", bottom: "0%",
          width: 660, height: 660,
          background: "radial-gradient(circle, hsl(40,95%,58%) 0%, transparent 65%)",
          filter: "blur(72px)", opacity: 0.42,
        }}
        animate={skip ? {} : { x: [0, -130, -90, 60, 50, -40, 0], y: [0, -100, 70, 30, -40, -80, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb 3 — orange-red coral, top-right (depth and contrast) */}
      <motion.div className="absolute rounded-full"
        style={{
          right: "-2%", top: "5%",
          width: 540, height: 540,
          background: "radial-gradient(circle, hsl(15,88%,58%) 0%, transparent 65%)",
          filter: "blur(58px)", opacity: 0.40,
        }}
        animate={skip ? {} : { x: [0, -90, -150, -100, -40, 20, 0], y: [0, 120, 80, -40, -60, 50, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb 4 — soft blue-violet (single cool accent — the "horizon at dusk") */}
      <motion.div className="absolute rounded-full"
        style={{
          left: "5%", bottom: "-5%",
          width: 600, height: 600,
          background: "radial-gradient(circle, hsl(230,70%,62%) 0%, transparent 65%)",
          filter: "blur(70px)", opacity: 0.32,
        }}
        animate={skip ? {} : { x: [0, 90, 140, 70, -15, 30, 0], y: [0, -80, -130, -65, 25, -40, 0] }}
        transition={{ duration: 21, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>

    {/* Soft vignette — anchored to body navy for depth without breaking the warm tone */}
    <div className="absolute inset-0"
      style={{
        background: "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 30%, hsl(230,55%,10% / 0.50) 100%)",
      }}
    />

    {/* Sparkles — tiny stars that pulse in and out */}
    {!skip && SPARKLES.map(s => (
      <motion.div key={s.id}
        className="absolute rounded-full bg-white"
        style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
        animate={{ opacity: [0, 0.75, 0], scale: [0.4, 1.3, 0.4] }}
        transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
      />
    ))}

    {/* Grain — fine noise for depth and premium feel */}
    <svg className="absolute inset-0 h-full w-full opacity-[0.038]" aria-hidden="true">
      <filter id="ss-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#ss-grain)" />
    </svg>
  </div>
);

// ── Airplane config ─────────────────────────────────────────────────────────
// Each plane: startX/Y from center (envelope), arc midpoint, rotation at start/end, size
const PLANES = [
  // from top-left
  { startX: -280, startY: -220, midX: -120, midY: -160, rotA: 45,  rotB: 30,  size: 44, delay: 0.3,  dur: 1.8 },
  // from top-right
  { startX:  300, startY: -200, midX:  130, midY: -140, rotA: 135, rotB: 150, size: 38, delay: 0.55, dur: 1.9 },
  // from right
  { startX:  380, startY:  30,  midX:  160, midY: -20,  rotA: 180, rotB: 160, size: 50, delay: 0.8,  dur: 2.0 },
  // from bottom-left large hero
  { startX: -320, startY:  260, midX: -120, midY:  120, rotA: -45, rotB: -20, size: 52, delay: 1.1,  dur: 2.2 },
  // from top, small
  { startX:   60, startY: -260, midX:   20, midY: -130, rotA: 90,  rotB: 75,  size: 30, delay: 1.4,  dur: 1.7 },
  // straggler from far left
  { startX: -420, startY:  60,  midX: -180, midY:   0,  rotA: 0,   rotB: 10,  size: 34, delay: 2.0,  dur: 2.1 },
];

const FlyingAirplane = ({ cfg }: { cfg: typeof PLANES[0] }) => {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ left: "50%", top: "50%", marginLeft: -cfg.size / 2, marginTop: -cfg.size / 2 }}
      initial={{ x: cfg.startX, y: cfg.startY, opacity: 0, scale: 0.6, rotate: cfg.rotA }}
      animate={{
        x:       [cfg.startX, cfg.midX, 0],
        y:       [cfg.startY, cfg.midY, 0],
        opacity: [0, 1, 1, 0],
        scale:   [0.6, 1.05, 0.22],
        rotate:  [cfg.rotA, (cfg.rotA + cfg.rotB) / 2, cfg.rotB],
      }}
      transition={{
        duration: cfg.dur,
        delay: cfg.delay,
        times: [0, 0.55, 0.88, 1],
        ease: [0.25, 0.46, 0.45, 0.94],
        repeat: 2,
        repeatDelay: 9,
      }}
    >
      <Plane size={cfg.size} />
    </motion.div>
  );
};

// ── Envelope ────────────────────────────────────────────────────────────────
const EnvelopeIcon = () => (
  <svg width="148" height="112" viewBox="0 0 148 112" fill="none">
    <defs>
      <linearGradient id="env-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(225,50%,22%)" />
        <stop offset="100%" stopColor="hsl(225,50%,16%)" />
      </linearGradient>
      <linearGradient id="env-flap" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(225,50%,26%)" />
        <stop offset="100%" stopColor="hsl(225,50%,18%)" />
      </linearGradient>
    </defs>
    {/* Shadow */}
    <ellipse cx="74" cy="108" rx="52" ry="5" fill="black" opacity="0.22" />
    {/* Body */}
    <rect x="4" y="10" width="140" height="92" rx="10" fill="url(#env-body)" stroke="hsl(var(--border))" strokeWidth="1.8" />
    {/* Inner highlight */}
    <rect x="5" y="11" width="138" height="30" rx="9" fill="white" opacity="0.04" />
    {/* Flap */}
    <path d="M4 20 L74 66 L144 20" stroke="hsl(var(--border))" strokeWidth="1.8" strokeLinejoin="round" fill="url(#env-flap)" />
    {/* Flap inner fold line */}
    <path d="M4 20 L74 66 L144 20" stroke="white" strokeWidth="0.6" strokeLinejoin="round" fill="none" opacity="0.08" />
    {/* Bottom fold lines */}
    <path d="M4 102 L50 60" stroke="hsl(var(--border))" strokeWidth="1" opacity="0.5" />
    <path d="M144 102 L98 60" stroke="hsl(var(--border))" strokeWidth="1" opacity="0.5" />
    {/* Seal */}
    <circle cx="74" cy="68" r="16" fill="hsl(var(--primary))" />
    <circle cx="74" cy="68" r="16" fill="white" opacity="0.12" />
    <path d="M66 68L71 73L82 62" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {/* Seal glow */}
    <circle cx="74" cy="68" r="16" stroke="white" strokeWidth="1" opacity="0.25" />
  </svg>
);

// ── Main component ───────────────────────────────────────────────────────────
const SuccessScreen = ({ email, userName, productName, onRestart }: SuccessScreenProps) => {
  const checkScale = useMotionValue(0);
  const checkOpacity = useTransform(checkScale, [0, 1], [0, 1]);
  const { play } = useSound();
  const { t } = useLang();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    animate(checkScale, 1, { type: "spring", stiffness: 200, damping: 15, delay: 0.5 });
    const timer = setTimeout(() => play("success"), 350);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const benefits = [
    { icon: "🎬", title: t.success.benefits.video.title,    desc: t.success.benefits.video.desc,    highlight: false },
    { icon: "📖", title: t.success.benefits.manual.title,   desc: t.success.benefits.manual.desc,   highlight: false },
    { icon: "❓", title: t.success.benefits.faq.title,      desc: t.success.benefits.faq.desc,      highlight: false },
    { icon: "🏷️", title: t.success.benefits.discount.title, desc: t.success.benefits.discount.desc, highlight: true  },
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10">

      <SuccessBackground skip={!!reduceMotion} />

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-5"
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 20 }}
      >

        {/* ── Envelope + airplanes ── */}
        <div className="relative flex items-center justify-center" style={{ width: 220, height: 180 }}>
          {/* Pulse rings — 3 expanding rings */}
          {!reduceMotion && [0, 0.6, 1.2].map((d, i) => (
            <motion.div key={i}
              className="pointer-events-none absolute rounded-2xl border border-primary/50"
              style={{ inset: -8 - i * 12 }}
              animate={{ scale: [1, 1.22, 1.44], opacity: [0.5, 0.15, 0] }}
              transition={{ duration: 2.2, repeat: 3, delay: 1.0 + d, ease: "easeOut" }}
            />
          ))}

          {/* Airplanes */}
          {PLANES.map((cfg, i) => (
            <FlyingAirplane key={i} cfg={cfg} />
          ))}

          {/* Envelope */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0, rotate: -12, y: 20 }}
            animate={{ scale: 1, rotate: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.15 }}
            style={{
              filter: "drop-shadow(0 0 28px hsl(27 92% 55% / 0.45)) drop-shadow(0 8px 24px rgba(0,0,0,0.35))",
            }}
          >
            <EnvelopeIcon />
          </motion.div>
        </div>

        {/* ── Title ── */}
        <motion.div className="text-center"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.55 }}
        >
          <h2 className="text-3xl font-bold text-foreground leading-tight">
            {userName ? t.success.title(userName) : t.success.titleNoName}
          </h2>
          <motion.p
            className="mt-1 text-lg font-semibold text-gradient"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {productName}
          </motion.p>
          <motion.p
            className="mt-1.5 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
          >
            {t.success.productOnWay}
          </motion.p>
        </motion.div>

        {/* ── Email card ── */}
        <motion.div
          className="w-full overflow-hidden rounded-2xl border border-primary/40 bg-card/80 backdrop-blur-sm"
          style={{ boxShadow: "0 0 0 1px hsl(var(--primary)/0.15), 0 4px 24px hsl(var(--primary)/0.12)" }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.75 }}
        >
          <div className="gradient-primary px-4 py-2">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-primary-foreground">
              {t.success.recipient}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-center font-mono text-sm text-foreground">{email}</p>
          </div>
        </motion.div>

        {/* ── Benefits ── */}
        <div className="grid w-full grid-cols-2 gap-3">
          {benefits.map((item, i) => (
            <motion.div key={i}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 backdrop-blur-sm ${
                item.highlight
                  ? "border-primary/60 bg-primary/12 ring-2 ring-primary/25"
                  : "border-border/60 bg-card/50"
              }`}
              initial={{ opacity: 0, y: 16, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.95 + i * 0.08 }}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className={`text-center text-xs font-bold leading-tight ${item.highlight ? "text-primary" : "text-foreground"}`}>
                {item.title}
              </span>
              <span className="text-center text-[10px] leading-snug text-muted-foreground">{item.desc}</span>
            </motion.div>
          ))}
        </div>

        {/* ── Spam note ── */}
        <motion.p className="text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.35 }}>
          {t.success.spamNote}
        </motion.p>

        {/* ── Restart button ── */}
        <motion.button
          onClick={onRestart}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-4 text-lg font-bold text-primary-foreground active:scale-95"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.45 }}
        >
          {t.success.restart}
        </motion.button>

        <motion.p className="text-[10px] text-muted-foreground/40 select-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
          © {new Date().getFullYear()} Webidoo · Webi-Match
        </motion.p>
      </motion.div>
    </div>
  );
};

export default SuccessScreen;
