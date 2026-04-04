import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import type { Product } from "@/data/products";
import { useMatchSound } from "@/hooks/useMatchSound";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";

interface MatchResultProps {
  product: Product;
  matchPercent: number;
  onClaim: () => void;
}

const CONFETTI_COLORS = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF",
  "#FF6EC7", "#845EC2", "#FFC75F", "#00C9A7",
  "#F9F871", "#FF8066", "#D65DB1", "#0089BA",
];

// Pre-compute random values at creation — never inside animate props
interface ConfettiData {
  id: number; delay: number; duration: number;
  left: string; color: string; size: number;
  rotateDeg: number; xOffset: number;
}

const ConfettiParticle = ({ delay, duration, left, color, size, rotateDeg, xOffset }: ConfettiData) => (
  <motion.div
    className="absolute rounded-sm pointer-events-none"
    style={{ left, top: "-5%", width: size, height: size * 0.6, backgroundColor: color }}
    animate={{ y: ["0vh", "110vh"], rotate: [0, rotateDeg], x: [0, xOffset], opacity: [1, 1, 0.4] }}
    transition={{ duration, repeat: Infinity, delay, ease: "easeIn" }}
  />
);

const MatchResult = ({ product, matchPercent, onClaim }: MatchResultProps) => {
  const [displayPercent, setDisplayPercent] = useState(0);
  const [isScanning, setIsScanning] = useState(true);
  const { play: playSound } = useMatchSound();
  const tier = useDevicePerformance();

  // Motion value for the ring — bypasses React re-renders entirely (no flicker)
  const ringMotionValue = useMotionValue(0);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = useTransform(
    ringMotionValue,
    [0, 100],
    [circumference, 0]
  );

  useEffect(() => {
    let frame: number;
    const timeout = setTimeout(() => {
      // Phase 1 — slot machine: shorter on low-end devices to reduce rAF load
      const slotDuration = tier === "low" ? 600 : tier === "mid" ? 900 : 1200;
      const slotStart = performance.now();

      const runSlot = (now: number) => {
        if (now - slotStart < slotDuration) {
          setDisplayPercent(Math.floor(Math.random() * 99) + 1);
          frame = requestAnimationFrame(runSlot);
        } else {
          // Phase 2 — smooth count: number + ring animate together via motion value
          setIsScanning(false);
          setDisplayPercent(0);
          playSound();

          // Animate ring via motion value — GPU-accelerated, zero React re-renders
          animate(ringMotionValue, matchPercent, {
            duration: 1.8,
            ease: [0.16, 1, 0.3, 1], // expo out — fast start, dramatic slow finish
          });

          // Mirror the number with rAF to stay in sync with the ring
          const countStart = performance.now();
          const countDuration = 1800;
          const runCount = (now2: number) => {
            const progress = Math.min((now2 - countStart) / countDuration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayPercent(Math.round(eased * matchPercent));
            if (progress < 1) frame = requestAnimationFrame(runCount);
          };
          frame = requestAnimationFrame(runCount);
        }
      };
      frame = requestAnimationFrame(runSlot);
    }, 900);

    return () => { cancelAnimationFrame(frame); clearTimeout(timeout); };
  }, [matchPercent]);

  // Adapt particle count to device tier
  const particleCount = tier === "high" ? 55 : tier === "mid" ? 28 : 12;

  // Pre-compute all random values once — never recalculated on re-render
  const confettiParticles = useMemo<ConfettiData[]>(() =>
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      delay: Math.random() * 4,
      duration: 1.8 + Math.random() * 2,
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + Math.random() * 10,
      rotateDeg: 360 * (Math.random() > 0.5 ? 1 : -1),
      xOffset: (Math.random() - 0.5) * 100,
    })), [particleCount]);

  const stars = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => i < Math.round(product.rating) ? "⭐" : "☆"),
    [product.rating]);

  const ringColor = matchPercent >= 90 ? "#6BCB77"
    : matchPercent >= 80 ? "#FFD93D"
    : matchPercent >= 65 ? "#FF8066"
    : "#4D96FF";

  const badgeBg = matchPercent >= 90 ? "bg-green-500"
    : matchPercent >= 80 ? "bg-yellow-400 text-gray-900"
    : matchPercent >= 65 ? "bg-orange-400 text-gray-900"
    : "bg-blue-500";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">

      {/* Confetti — particles pre-computed, no random on re-render */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confettiParticles.map((p) => <ConfettiParticle key={p.id} {...p} />)}
      </div>

      {/* Entrance burst — skipped on low-end devices */}
      {tier !== "low" && (
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          {CONFETTI_COLORS.slice(0, tier === "mid" ? 6 : 10).map((color, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1.5, 0],
                x: Math.cos((i * 36 * Math.PI) / 180) * 140,
                y: Math.sin((i * 36 * Math.PI) / 180) * 140,
              }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          ))}
        </motion.div>
      )}

      {/* Main content — single entrance, no nested competing springs */}
      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Circular ring — ring via motion value, no React re-renders */}
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2, stiffness: 180, damping: 22 }}
        >
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none"
              stroke="hsl(var(--muted))" strokeWidth="8" opacity="0.3" />
            <motion.circle
              cx="60" cy="60" r="54" fill="none"
              stroke={ringColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 60 60)"
              style={{ filter: `drop-shadow(0 0 6px ${ringColor}50)` }}
            />
            {/* Glow pulse — only after scanning */}
            {!isScanning && (
              <motion.circle
                cx="60" cy="60" r="54" fill="none"
                stroke={ringColor} strokeWidth="2"
                animate={{ r: [54, 57, 54], opacity: [0.25, 0, 0.25] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-4xl font-bold tabular-nums ${isScanning ? "text-muted-foreground" : "text-gradient"}`}>
              {displayPercent}%
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {isScanning ? "analisi..." : "match"}
            </span>
          </div>
        </motion.div>

        <motion.p
          className="text-xl font-bold text-foreground"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          🎉 MATCH PERFETTO!
        </motion.p>

        {/* Product card */}
        <motion.div
          className="gradient-card shadow-card w-full overflow-hidden rounded-3xl border border-border"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
        >
          <div className="relative flex h-52 items-center justify-center bg-secondary/50 overflow-hidden">
            {product.image ? (
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <span className="text-6xl">📦</span>
                <span className="text-xs font-medium">Immagine prodotto</span>
              </div>
            )}
            {!isScanning && (
              <motion.div
                className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg ${badgeBg}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
              >
                {displayPercent}% Match
              </motion.div>
            )}
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

        {/* Highlights */}
        <motion.div
          className="flex w-full gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
        >
          {[
            { icon: "🎥", label: "Video 30s" },
            { icon: "📖", label: "Manuale" },
            { icon: "💰", label: "Sconto VIP" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-border bg-card/80 p-3 backdrop-blur-sm"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-[11px] font-semibold text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.p
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          Ricevi video, manuale, FAQ e uno sconto esclusivo direttamente nella tua email!
        </motion.p>

        <motion.button
          onClick={onClaim}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-5 text-xl font-bold text-primary-foreground active:scale-95"
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          🔍 A cosa serve?
        </motion.button>

        <motion.p
          className="text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.1, duration: 0.4 }}
        >
          👆 Premi sul tasto sopra per ricevere tutto nella tua mail
        </motion.p>
      </motion.div>
    </div>
  );
};

export default MatchResult;
