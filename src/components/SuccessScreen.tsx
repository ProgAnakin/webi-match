import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import envelopeImg from "@/assets/webidoo-envelope.png";

interface SuccessScreenProps {
  email: string;
  productName: string;
  onRestart: () => void;
}

// Paper plane / letter that flies into the envelope
const FlyingLetter = ({ delay, startX, startY }: { delay: number; startX: number; startY: number }) => (
  <motion.div
    className="pointer-events-none absolute"
    style={{ left: startX, top: startY }}
    initial={{ opacity: 0, scale: 0.7 }}
    animate={{
      opacity: [0, 1, 1, 0],
      x: [0, (50 - startX / 4), (50 - startX / 4) * 1.5],
      y: [0, -60, -120 + startY / 3],
      scale: [0.7, 0.9, 0.3],
      rotate: [0, -5, 10],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      delay,
      ease: "easeInOut",
      repeatDelay: 2,
    }}
  >
    {/* SVG paper/document icon */}
    <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
      <rect x="2" y="2" width="24" height="30" rx="3" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
      <line x1="7" y1="10" x2="21" y2="10" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="7" y1="15" x2="18" y2="15" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <line x1="7" y1="20" x2="15" y2="20" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      {/* Small fold corner */}
      <path d="M20 2 L24 2 L24 6 Z" fill="hsl(var(--muted))" />
    </svg>
  </motion.div>
);

const SuccessScreen = ({ email, productName, onRestart }: SuccessScreenProps) => {
  const checkScale = useMotionValue(0);
  const checkOpacity = useTransform(checkScale, [0, 1], [0, 1]);

  useEffect(() => {
    animate(checkScale, 1, { type: "spring", stiffness: 200, damping: 15, delay: 1.5 });
  }, []);

  const benefits = [
    { icon: "🎬", title: "Video 30s", desc: "Video esplicativo" },
    { icon: "📖", title: "Manuale", desc: "Guida completa" },
    { icon: "❓", title: "FAQ", desc: "Domande frequenti" },
    { icon: "🏷️", title: "Sconto", desc: "Offerta esclusiva" },
  ];

  // Letters flying from different positions toward the center envelope
  const letters = [
    { delay: 0, startX: 40, startY: 500 },
    { delay: 2.5, startX: 300, startY: 550 },
    { delay: 5, startX: 150, startY: 600 },
    { delay: 7.5, startX: 60, startY: 480 },
    { delay: 10, startX: 280, startY: 520 },
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Subtle radial glow - professional, no particles */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 35%, hsl(var(--primary) / 0.08) 0%, transparent 55%)",
        }}
      />

      {/* Subtle grid pattern for depth */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Flying letters animation toward envelope */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {letters.map((l, i) => (
          <FlyingLetter key={i} {...l} />
        ))}
      </div>

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
      >
        {/* Envelope with paper entering animation */}
        <div className="relative flex flex-col items-center">
          {/* Paper sliding into envelope */}
          <motion.div
            className="absolute z-10"
            style={{ top: -20 }}
            initial={{ y: -80, opacity: 1, scale: 1 }}
            animate={{ y: [- 80, -40, 0, 10], opacity: [1, 1, 1, 0], scale: [1, 0.95, 0.85, 0.6] }}
            transition={{ duration: 1.8, delay: 0.3, ease: "easeInOut" }}
          >
            <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
              <rect x="5" y="5" width="70" height="90" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
              <line x1="18" y1="25" x2="62" y2="25" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
              <line x1="18" y1="35" x2="55" y2="35" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
              <line x1="18" y1="45" x2="48" y2="45" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
              <line x1="18" y1="55" x2="42" y2="55" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
              <path d="M58 5 L70 5 L70 17 Z" fill="hsl(var(--muted))" />
            </svg>
          </motion.div>

          {/* Envelope image */}
          <motion.div
            className="relative"
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <img
              src={envelopeImg}
              alt="Email inviata"
              width={160}
              height={160}
              className="drop-shadow-2xl"
            />
            {/* Success checkmark badge */}
            <motion.div
              className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full shadow-lg"
              style={{
                scale: checkScale,
                opacity: checkOpacity,
                backgroundColor: "hsl(142, 71%, 45%)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 1.8 }}
                />
              </svg>
            </motion.div>
          </motion.div>
        </div>

        {/* Title & subtitle */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-foreground">Email Inviata! ✨</h2>
          <p className="mt-2 text-muted-foreground">
            La guida esclusiva del <span className="font-semibold text-gradient">{productName}</span> è stata inviata a:
          </p>
        </motion.div>

        {/* Email display card */}
        <motion.div
          className="w-full overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="gradient-primary px-4 py-2">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary-foreground">
              Destinatario
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
              className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-bold text-foreground">{item.title}</span>
              <span className="text-[10px] text-muted-foreground">{item.desc}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Info text */}
        <motion.p
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Controlla la tua casella di posta per scoprire tutto!
        </motion.p>

        {/* Restart button */}
        <motion.button
          onClick={onRestart}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-4 text-lg font-bold text-primary-foreground transition-transform active:scale-95"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          🔄 Gioca di Nuovo
        </motion.button>
      </motion.div>
    </div>
  );
};

export default SuccessScreen;
