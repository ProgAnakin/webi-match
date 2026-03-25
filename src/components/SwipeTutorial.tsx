import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const SwipeTutorial = ({ onDismiss }: { onDismiss: () => void }) => {
  const [step, setStep] = useState(0); // 0=left, 1=right, 2=done

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1600);
    const t2 = setTimeout(() => setStep(2), 3200);
    const t3 = setTimeout(onDismiss, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDismiss]);

  return (
    <AnimatePresence>
      {step < 2 && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

          {/* Hand animation */}
          <motion.div className="relative z-10 flex flex-col items-center gap-6">
            {/* Fake card */}
            <motion.div
              className="gradient-card shadow-card flex h-32 w-56 items-center justify-center rounded-2xl border border-border"
              animate={{
                x: step === 0 ? [0, -120, 0] : [0, 120, 0],
                rotate: step === 0 ? [0, -15, 0] : [0, 15, 0],
              }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              <span className="text-5xl">{step === 0 ? "❌" : "✅"}</span>
            </motion.div>

            {/* Label */}
            <motion.p
              key={step}
              className="text-lg font-semibold text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {step === 0 ? "← Swipe per NO" : "Swipe per SÌ →"}
            </motion.p>

            {/* Hand icon */}
            <motion.div
              className="text-4xl"
              animate={{
                x: step === 0 ? [0, -80, 0] : [0, 80, 0],
              }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              👆
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SwipeTutorial;
