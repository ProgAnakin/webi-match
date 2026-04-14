import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import webidooLogo from "@/assets/webidoo-logo.png";
import DiscoveryBackground from "./DiscoveryBackground";
import { useLang } from "@/i18n/LanguageContext";
import { LANGUAGES } from "@/i18n/translations";

interface SplashScreenProps {
  onComplete: () => void;
}

const AUTO_ADVANCE_MS = 4500;

// ─── Language Selector ────────────────────────────────────────────────────────
const LanguageSelector = () => {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-1.5">
      {LANGUAGES.map(({ code, flag, label }) => (
        <button
          key={code}
          onClick={(e) => { e.stopPropagation(); setLang(code); }}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
            lang === code
              ? "bg-primary text-primary-foreground shadow-sm scale-105"
              : "bg-card/80 text-muted-foreground border border-border/60 hover:bg-card"
          }`}
        >
          <span>{flag}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const { t } = useLang();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(onComplete, AUTO_ADVANCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [onComplete]);

  const steps = [
    { icon: "⚡", label: t.splash.step1 },
    { icon: "🎯", label: t.splash.step2 },
    { icon: "🎁", label: t.splash.step3 },
  ];

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-8 cursor-pointer select-none"
      onClick={onComplete}
    >
      <DiscoveryBackground />

      {/* Language selector — top-right */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6">

        {/* Logo */}
        <motion.img
          src={webidooLogo}
          alt="Webidoo"
          className="h-24 w-auto"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18, ease: "easeOut" }}
        >
          <h1 className="mb-2 text-5xl font-bold uppercase tracking-widest">
            <span className="text-gradient">WEBI</span>
            <span className="text-foreground"> MATCH</span>
          </h1>
          <p className="text-2xl font-semibold text-foreground leading-snug">
            {t.splash.headline}
          </p>
          <p className="mt-1 text-lg text-muted-foreground">
            {t.splash.sub}
          </p>
        </motion.div>

        {/* Step pills */}
        <div className="flex flex-col items-center gap-3 w-full">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 px-5 py-3 backdrop-blur-sm w-full max-w-xs"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.38 + i * 0.12, ease: "easeOut" }}
            >
              <span className="text-2xl">{step.icon}</span>
              <span className="text-sm font-semibold text-foreground">{step.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Auto-advance progress bar */}
        <motion.div
          className="w-full max-w-xs overflow-hidden rounded-full bg-muted h-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <motion.div
            className="h-full rounded-full gradient-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: "linear", delay: 0.7 }}
          />
        </motion.div>

        {/* Tap hint */}
        <motion.p
          className="text-sm font-semibold text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.6, 1] }}
          transition={{ duration: 1.8, delay: 1.0, repeat: Infinity, repeatType: "reverse" }}
        >
          {t.splash.tap}
        </motion.p>
      </div>
    </div>
  );
};

export default SplashScreen;
