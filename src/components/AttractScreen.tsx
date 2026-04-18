import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import webidooLogo from "@/assets/webidoo-logo.png";
import { AttractBackground } from "./AttractBackground";
import { useLang } from "@/i18n/LanguageContext";
import { LANGUAGES } from "@/i18n/translations";

const MSG_EMOJIS = ["🎯", "🎁", "💡", "✨"];

const LanguageSelectorFeatured = () => {
  const { lang, setLang } = useLang();
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-white/40 text-xs font-medium uppercase tracking-widest">🌍 Scegli la lingua</p>
      <div className="flex items-center gap-2">
        {LANGUAGES.map(({ code, flag, label }) => (
          <button
            key={code}
            onClick={(e) => { e.stopPropagation(); setLang(code); }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
              lang === code
                ? "text-white scale-110 shadow-lg"
                : "bg-white/8 text-white/50 border border-white/15 hover:bg-white/15 hover:text-white/80"
            }`}
            style={lang === code ? {
              background: "linear-gradient(135deg, hsl(27,92%,55%), hsl(16,100%,48%))",
              boxShadow: "0 0 20px hsla(27,92%,55%,0.4), 0 4px 16px hsla(0,0%,0%,0.3)",
            } : {}}
          >
            <span className="text-lg">{flag}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface AttractScreenProps {
  onComplete: () => void;
}

const AttractScreen = ({ onComplete }: AttractScreenProps) => {
  const { t } = useLang();
  const [msgIndex, setMsgIndex] = useState(0);

  const messages = [
    { emoji: MSG_EMOJIS[0], text: t.splash.step1 },
    { emoji: MSG_EMOJIS[1], text: t.splash.step2 },
    { emoji: MSG_EMOJIS[2], text: t.splash.step3 },
    { emoji: MSG_EMOJIS[3], text: t.splash.step4 },
  ];

  const chips = [
    { icon: "⚡", label: t.splash.chip1 },
    { icon: "🧠", label: t.splash.chip2 },
    { icon: "🎁", label: t.splash.chip3 },
  ];

  useEffect(() => {
    const id = setInterval(() => setMsgIndex((i) => (i + 1) % messages.length), 2500);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{ background: "hsl(225,60%,7%)" }}
    >
      <AttractBackground />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">

        {/* Logo with glow halo */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div style={{
            position: "absolute", inset: "-40%",
            background: "radial-gradient(circle, hsla(27,92%,55%,0.55) 0%, transparent 70%)",
            filter: "blur(30px)",
            borderRadius: "50%",
          }} />
          <img
            src={webidooLogo}
            alt="Webidoo Store"
            className="relative h-56 w-auto"
            style={{ animation: "at-logo-glow 3s ease-in-out infinite" }}
          />
        </motion.div>

        {/* WEBI MATCH headline */}
        <motion.h1
          className="text-7xl font-black uppercase leading-none"
          style={{ letterSpacing: "0.12em" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <span style={{ color: "hsl(27,92%,55%)" }}>WEBI</span>
          <span className="text-white"> MATCH</span>
        </motion.h1>

        {/* Cycling message */}
        <div className="h-14 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${msgIndex}-${t.splash.step1}`}
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 14, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.95 }}
              transition={{ duration: 0.35 }}
            >
              <span className="text-3xl">{messages[msgIndex].emoji}</span>
              <span className="text-xl font-semibold text-white/90">
                {messages[msgIndex].text}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {messages.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: i === msgIndex ? 20 : 6,
                opacity: i === msgIndex ? 1 : 0.35,
                background: i === msgIndex ? "hsl(27,92%,55%)" : "rgba(255,255,255,0.5)",
              }}
              style={{ height: 6 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Feature chips */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {chips.map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Language selector — featured */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          onClick={(e) => e.stopPropagation()}
        >
          <LanguageSelectorFeatured />
        </motion.div>

        {/* CTA button */}
        <motion.div
          className="mt-4 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            className="rounded-2xl px-12 py-4 text-lg font-black text-white uppercase tracking-wider"
            style={{
              background: "linear-gradient(135deg, hsl(27,92%,55%), hsl(16,100%,48%))",
              boxShadow: "0 0 40px hsla(27,92%,55%,0.5), 0 8px 32px hsla(0,0%,0%,0.4)",
              letterSpacing: "0.08em",
            }}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            whileTap={{ scale: 0.96 }}
            onClick={onComplete}
          >
            {t.splash.tap}{" "}
            <span style={{ display: "inline-block", animation: "at-arrow-nudge 1s ease-in-out infinite" }}>
              →
            </span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default AttractScreen;
