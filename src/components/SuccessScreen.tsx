import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useMemo } from "react";
import envelopeImg from "@/assets/webidoo-envelope.png";

interface SuccessScreenProps {
  email: string;
  productName: string;
  onRestart: () => void;
}

// Floating particle for celebration
const FloatingParticle = ({ delay, x, size, color }: {
  delay: number; x: string; size: number; color: string;
}) => (
  <motion.div
    className="absolute rounded-full"
    style={{ left: x, bottom: "-10%", width: size, height: size, backgroundColor: color }}
    animate={{ y: [0, -800], opacity: [0, 1, 1, 0], scale: [0.5, 1, 0.8] }}
    transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay, ease: "easeOut" }}
  />
);

const PARTICLE_COLORS = [
  "hsl(var(--primary))", "#FFD93D", "#6BCB77", "#4D96FF",
  "#FF6EC7", "#845EC2", "#FFC75F", "#00C9A7",
];

const SuccessScreen = ({ email, productName, onRestart }: SuccessScreenProps) => {
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      delay: Math.random() * 5,
      x: `${Math.random() * 100}%`,
      size: 4 + Math.random() * 8,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    })), []);

  const checkScale = useMotionValue(0);
  const checkOpacity = useTransform(checkScale, [0, 1], [0, 1]);

  useEffect(() => {
    animate(checkScale, 1, { type: "spring", stiffness: 200, damping: 15, delay: 0.5 });
  }, []);

  const benefits = [
    { icon: "🎬", title: "Video 30s", desc: "Video esplicativo" },
    { icon: "📖", title: "Manuale", desc: "Guida completa" },
    { icon: "❓", title: "FAQ", desc: "Domande frequenti" },
    { icon: "🏷️", title: "Sconto", desc: "Offerta esclusiva" },
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Floating particles background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <FloatingParticle key={p.id} {...p} />
        ))}
      </div>

      {/* Radial glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 40%, hsl(var(--primary) / 0.15) 0%, transparent 60%)",
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
      >
        {/* Custom envelope icon with success check */}
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <motion.img
            src={envelopeImg}
            alt="Email inviata"
            width={160}
            height={160}
            className="drop-shadow-2xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Success checkmark badge */}
          <motion.div
            className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 shadow-lg"
            style={{ scale: checkScale, opacity: checkOpacity }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <motion.path
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Title & subtitle */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
          transition={{ delay: 0.5 }}
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
          transition={{ delay: 0.7 }}
        >
          {benefits.map((item, i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
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
          transition={{ delay: 1 }}
        >
          Controlla la tua casella di posta per scoprire tutto! 📬
        </motion.p>

        {/* Restart button */}
        <motion.button
          onClick={onRestart}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-4 text-lg font-bold text-primary-foreground transition-transform active:scale-95"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          🔄 Gioca di Nuovo
        </motion.button>
      </motion.div>
    </div>
  );
};

export default SuccessScreen;
