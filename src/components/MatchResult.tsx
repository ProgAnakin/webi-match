import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import type { Product } from "@/data/products";

interface MatchResultProps {
  product: Product;
  matchPercent: number;
  onClaim: () => void;
}

// Confetti particle component
const ConfettiParticle = ({ delay, duration, left, color, size }: {
  delay: number; duration: number; left: string; color: string; size: number;
}) => (
  <motion.div
    className="absolute rounded-sm"
    style={{
      left,
      top: "-5%",
      width: size,
      height: size * 0.6,
      backgroundColor: color,
    }}
    animate={{
      y: ["0vh", "110vh"],
      rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
      x: [0, (Math.random() - 0.5) * 120],
      opacity: [1, 1, 0.5],
    }}
    transition={{
      duration,
      repeat: Infinity,
      delay,
      ease: "easeIn",
    }}
  />
);

const CONFETTI_COLORS = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF",
  "#FF6EC7", "#845EC2", "#FFC75F", "#00C9A7",
  "#F9F871", "#FF8066", "#D65DB1", "#0089BA",
];

const MatchResult = ({ product, matchPercent, onClaim }: MatchResultProps) => {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  // Animate percentage counter
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1500;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercent(Math.round(eased * matchPercent));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [matchPercent]);

  // Generate confetti particles
  const confettiParticles = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      delay: Math.random() * 4,
      duration: 1.5 + Math.random() * 2.5,
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + Math.random() * 12,
    })), []);

  const stars = Array.from({ length: 5 }, (_, i) =>
    i < Math.round(product.rating) ? "⭐" : "☆"
  );

  // Determine ring color based on percentage
  const ringColor = matchPercent >= 90
    ? "hsl(var(--primary))"
    : matchPercent >= 80
      ? "#FFD93D"
      : "#4D96FF";

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (circumference * animatedPercent) / 100;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Confetti background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confettiParticles.map((p) => (
          <ConfettiParticle key={p.id} {...p} />
        ))}
      </div>

      {/* Burst effect on load */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full"
            style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1.5, 0],
              x: Math.cos((i * 30 * Math.PI) / 180) * 150,
              y: Math.sin((i * 30 * Math.PI) / 180) * 150,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ))}
      </motion.div>

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Circular percentage indicator */}
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.3, stiffness: 150 }}
        >
          <svg width="140" height="140" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              opacity="0.3"
            />
            {/* Animated progress ring */}
            <motion.circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 60 60)"
              style={{ filter: `drop-shadow(0 0 8px ${ringColor}40)` }}
            />
            {/* Glow pulse */}
            <motion.circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={ringColor}
              strokeWidth="2"
              opacity="0.3"
              animate={{ r: [54, 58, 54], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-bold text-gradient">{animatedPercent}%</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              match
            </span>
          </div>
        </motion.div>

        <motion.p
          className="text-xl font-bold text-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          🎉 MATCH PERFETTO!
        </motion.p>

        {/* Product card with image */}
        <motion.div
          className="gradient-card shadow-card w-full overflow-hidden rounded-3xl border border-border"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {/* Product image area */}
          <div className="relative flex h-52 items-center justify-center bg-secondary/50 overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <span className="text-6xl">📦</span>
                <span className="text-xs font-medium">Immagine prodotto</span>
              </div>
            )}
            {/* Floating badge */}
            <motion.div
              className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 1 }}
            >
              {animatedPercent}% Match
            </motion.div>
          </div>

          <div className="p-6">
            <h3 className="text-2xl font-bold text-foreground">{product.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-2xl font-bold text-gradient">{product.price}</span>
              <span className="text-lg">{stars.join("")}</span>
            </div>
          </div>
        </motion.div>

        {/* Dynamic highlights */}
        <motion.div
          className="flex w-full gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          {[
            { icon: "🎥", label: "Video 30s" },
            { icon: "📖", label: "Manuale" },
            { icon: "💰", label: "Sconto VIP" },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-border bg-card/80 p-3 backdrop-blur-sm"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-[11px] font-semibold text-muted-foreground">{item.label}</span>
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
          Ricevi video, manuale, FAQ e uno sconto esclusivo direttamente nella tua email!
        </motion.p>

        {/* CTA Button */}
        <motion.button
          onClick={onClaim}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-5 text-xl font-bold text-primary-foreground transition-transform active:scale-95"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          🔍 Pra che serve isso?
        </motion.button>

        <motion.p
          className="text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.4 }}
        >
          📧 Clicca per ricevere tutto nella tua email
        </motion.p>
      </motion.div>
    </div>
  );
};

export default MatchResult;
