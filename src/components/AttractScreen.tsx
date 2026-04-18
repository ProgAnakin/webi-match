import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import webidooLogo from "@/assets/webidoo-logo.png";
import { AttractBackground } from "./AttractBackground";
import { useLang } from "@/i18n/LanguageContext";
import { LANGUAGES } from "@/i18n/translations";

const MSG_EMOJIS = ["🎯", "🎁", "💡", "✨"];

// ── Language picker modal ──────────────────────────────────────────────────────
const LanguageModal = ({ onClose }: { onClose: () => void }) => {
  const { lang, setLang } = useLang();
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="mx-6 w-full max-w-sm rounded-3xl p-7"
        style={{
          background: "linear-gradient(160deg, hsl(225,50%,12%) 0%, hsl(225,40%,9%) 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
        }}
        initial={{ scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 24, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-white/40">
          🌍 Lingua / Language
        </p>

        <div className="flex flex-col gap-3">
          {LANGUAGES.map(({ code, flag, name }) => {
            const active = lang === code;
            return (
              <button
                key={code}
                onClick={() => { setLang(code); setTimeout(onClose, 220); }}
                className="flex items-center gap-4 rounded-2xl px-5 py-3.5 transition-all duration-200 active:scale-95"
                style={active ? {
                  background: "linear-gradient(135deg, hsl(27,92%,55%), hsl(16,100%,48%))",
                  boxShadow: "0 0 24px hsla(27,92%,55%,0.4), 0 4px 16px rgba(0,0,0,0.3)",
                } : {
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <span className="text-3xl leading-none">{flag}</span>
                <span className={`flex-1 text-left text-base font-bold ${active ? "text-white" : "text-white/70"}`}>
                  {name}
                </span>
                {active && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Main attract screen ────────────────────────────────────────────────────────
interface AttractScreenProps {
  onComplete: () => void;
}

const AttractScreen = ({ onComplete }: AttractScreenProps) => {
  const { t, lang } = useLang();
  const [msgIndex, setMsgIndex] = useState(0);
  const [showLangModal, setShowLangModal] = useState(false);

  const messages = [
    { emoji: MSG_EMOJIS[0], text: t.splash.step1 },
    { emoji: MSG_EMOJIS[1], text: t.splash.step2 },
    { emoji: MSG_EMOJIS[2], text: t.splash.step3 },
    { emoji: MSG_EMOJIS[3], text: t.splash.step4 },
  ];

  useEffect(() => {
    const id = setInterval(() => setMsgIndex((i) => (i + 1) % messages.length), 2500);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <div
      className="relative flex h-screen flex-col items-center justify-center overflow-hidden"
      style={{ background: "hsl(225,60%,7%)" }}
    >
      <AttractBackground />

      {/* Language modal */}
      <AnimatePresence>
        {showLangModal && <LanguageModal onClose={() => setShowLangModal(false)} />}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-7 px-6 text-center">

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
            className="relative h-44 w-auto"
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
        <div className="h-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${msgIndex}-${lang}`}
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-2xl">{messages[msgIndex].emoji}</span>
              <span className="text-lg font-semibold text-white/90">
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

        {/* Language button */}
        <motion.button
          className="flex items-center gap-2.5 rounded-2xl px-6 py-3 transition-all duration-200 active:scale-95"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          onClick={() => setShowLangModal(true)}
        >
          <span className="text-xl leading-none">{currentLang.flag}</span>
          <span className="text-sm font-semibold text-white/80">{t.splash.chooseLang}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="ml-0.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.button>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <motion.button
            className="rounded-2xl px-14 py-4 text-lg font-black text-white uppercase tracking-wider"
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
