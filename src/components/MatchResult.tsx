import { motion } from "framer-motion";
import type { Product } from "@/data/products";

interface MatchResultProps {
  product: Product;
  matchPercent: number;
  onClaim: () => void;
}

const MatchResult = ({ product, matchPercent, onClaim }: MatchResultProps) => {
  const stars = Array.from({ length: 5 }, (_, i) =>
    i < Math.round(product.rating) ? "⭐" : "☆"
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      {/* Confetti emojis */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {["🎉", "🎊", "✨", "🎯", "🔥", "💎"].map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl"
            style={{
              left: `${10 + (i * 15) % 80}%`,
              top: "-10%",
            }}
            animate={{
              y: ["0vh", "110vh"],
              rotate: [0, 360],
              opacity: [1, 0.5],
            }}
            transition={{
              duration: 2.5 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeIn",
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Match percentage */}
        <motion.div
          className="text-center"
          initial={{ y: -30 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.p
            className="text-6xl font-bold text-gradient"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.5 }}
          >
            🎉 {matchPercent}%
          </motion.p>
          <p className="mt-1 text-xl font-semibold text-foreground">MATCH PERFETTO!</p>
        </motion.div>

        {/* Product card */}
        <motion.div
          className="gradient-card shadow-card w-full overflow-hidden rounded-3xl border border-border"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {/* Product image placeholder */}
          <div className="flex h-48 items-center justify-center bg-secondary text-6xl">
            🎁
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

        {/* FAQ preview */}
        <motion.div
          className="w-full space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-center text-sm font-semibold text-muted-foreground">
            ❓ Domande più frequenti
          </p>
          {product.faq.map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-semibold text-foreground">{item.q}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          onClick={onClaim}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-5 text-xl font-bold text-primary-foreground transition-transform active:scale-95"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          🎁 Ricevi la Guida Esclusiva GRATIS!
        </motion.button>

        <motion.p
          className="text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.4 }}
        >
          📧 Video esplicativo + Manuale + FAQ + Sconto esclusivo
        </motion.p>
      </motion.div>
    </div>
  );
};

export default MatchResult;
