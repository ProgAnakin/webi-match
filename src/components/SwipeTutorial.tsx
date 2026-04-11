import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LanguageContext";

const SwipeTutorial = ({ onDismiss }: { onDismiss: () => void }) => {
  const { t } = useLang();
  const [step, setStep] = useState<"no" | "yes">("no");

  // Loop "no" → "yes" → "no" indefinitely until user clicks the button
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s === "no" ? "yes" : "no"));
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated demo card */}
        <motion.div
          className="gradient-card shadow-card flex h-32 w-56 items-center justify-center rounded-2xl border border-border"
          animate={{
            x: step === "no" ? [0, -120, 0] : [0, 120, 0],
            rotate: step === "no" ? [0, -15, 0] : [0, 15, 0],
          }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={step}
              className="text-5xl"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.2 }}
            >
              {step === "no" ? "❌" : "✅"}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* Direction label */}
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            className="text-lg font-semibold text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {step === "no" ? t.tutorial.no : t.tutorial.yes}
          </motion.p>
        </AnimatePresence>

        {/* Finger icon */}
        <motion.div
          className="text-4xl"
          animate={{ x: step === "no" ? [0, -80, 0] : [0, 80, 0] }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          👆
        </motion.div>

        {/* Dismiss button */}
        <motion.button
          onClick={onDismiss}
          className="mt-2 rounded-2xl bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground shadow-lg active:scale-95"
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Sono pronto!
        </motion.button>
      </div>
    </div>
  );
};

export default SwipeTutorial;
