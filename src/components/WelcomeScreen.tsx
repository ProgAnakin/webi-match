import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import webidooLogo from "@/assets/webidoo-logo.png";
import DiscoveryBackground from "./DiscoveryBackground";

interface WelcomeScreenProps {
  onStart: (email: string) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const isValid = EMAIL_REGEX.test(email.trim());
  const showError = touched && email.trim().length > 0 && !isValid;
  const showSuccess = email.trim().length > 0 && isValid;

  const handleStart = () => {
    setTouched(true);
    if (!isValid) return;
    onStart(email.trim());
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <DiscoveryBackground />

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
            Trova il tuo gadget perfetto! 🎯
          </p>
        </motion.div>

        {/* Email input */}
        <motion.div
          className="w-full space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="relative">
            <input
              type="email"
              placeholder="La tua email migliore 📧"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setTouched(true);
              }}
              onBlur={() => setTouched(true)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              className={`w-full rounded-2xl border bg-card px-6 py-4 pr-14 text-center text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
                showSuccess
                  ? "border-green-500 focus:ring-green-400"
                  : showError
                  ? "border-destructive focus:ring-destructive"
                  : "border-border focus:ring-primary"
              }`}
            />
            <AnimatePresence mode="wait">
              {showSuccess && (
                <motion.span
                  key="check"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
                >
                  <CheckCircle2 className="h-6 w-6" />
                </motion.span>
              )}
              {showError && (
                <motion.span
                  key="error"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-destructive"
                >
                  <XCircle className="h-6 w-6" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {showError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-center text-sm text-destructive"
              >
                Per favore, inserisci un'email valida.
              </motion.p>
            )}
          </AnimatePresence>
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
          🚀 INIZIA IL GIOCO!
        </motion.button>

        <motion.p
          className="text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.2 }}
        >
          Rispondi a 8 domande veloci e scopri il match perfetto
        </motion.p>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
