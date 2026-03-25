import { useState } from "react";
import { motion } from "framer-motion";
import webidooLogo from "@/assets/webidoo-logo.png";

interface WelcomeScreenProps {
  onStart: (email: string) => void;
}

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleStart = () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Por favor, insira um email válido.");
      return;
    }
    onStart(trimmed);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      {/* Floating emojis background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {["⚽️", "🎵", "📸", "🎮", "✈️", "🧘", "📹", "🏠"].map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl opacity-20"
            style={{
              left: `${10 + (i * 12) % 80}%`,
              top: `${15 + (i * 17) % 60}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-8"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Logo */}
        <motion.img
          src={webidooLogo}
          alt="Webidoo Store"
          className="mb-4 h-52 w-auto"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />

        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="mb-2 text-5xl font-bold uppercase tracking-widest">
            <span className="text-gradient">WEBI</span>
            <span className="text-foreground"> MATCH</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Encontre seu gadget perfeito! 🎯
          </p>
        </motion.div>

        {/* Email input */}
        <motion.div
          className="w-full space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <input
            type="email"
            placeholder="Seu melhor email 📧"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            className="w-full rounded-2xl border border-border bg-card px-6 py-4 text-center text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
        </motion.div>

        {/* Start button */}
        <motion.button
          onClick={handleStart}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-5 text-xl font-bold text-primary-foreground transition-transform active:scale-95"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          🚀 COMEÇAR JOGO!
        </motion.button>

        <motion.p
          className="text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.2 }}
        >
          Responda 8 perguntas rápidas e descubra o match perfeito
        </motion.p>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
