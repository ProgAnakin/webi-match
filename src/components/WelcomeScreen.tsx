import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import webidooLogo from "@/assets/webidoo-logo.png";
import DiscoveryBackground from "./DiscoveryBackground";
import { useSound } from "@/hooks/useSound";

export interface UserInfo {
  nome: string;
  cognome: string;
  email: string;
}

interface WelcomeScreenProps {
  onStart: (user: UserInfo) => void;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { play } = useSound();

  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const isNomeValid = nome.trim().length >= 2;
  const isCognomeValid = cognome.trim().length >= 2;
  const isFormValid = isNomeValid && isCognomeValid && isEmailValid;

  const showEmailError = emailTouched && email.trim().length > 0 && !isEmailValid;
  const showEmailOk = email.trim().length > 0 && isEmailValid;
  const showNomeError = submitted && !isNomeValid;
  const showCognomeError = submitted && !isCognomeValid;

  const handleStart = () => {
    setSubmitted(true);
    setEmailTouched(true);
    if (!isFormValid) return;
    play("start");
    onStart({ nome: nome.trim(), cognome: cognome.trim(), email: email.trim() });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-8">
      <DiscoveryBackground />

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Logo */}
        <motion.img
          src={webidooLogo}
          alt="Webidoo Store"
          className="h-44 w-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />

        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="mb-1 text-5xl font-bold uppercase tracking-widest">
            <span className="text-gradient">WEBI</span>
            <span className="text-foreground"> MATCH</span>
          </h1>
          <p className="text-base text-muted-foreground">
            Trova il tuo gadget perfetto! 🎯
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          className="w-full space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {/* Nome + Cognome */}
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Nome"
                value={nome}
                onChange={(e) => { setNome(e.target.value); setSubmitted(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                className={`w-full rounded-2xl border bg-card px-4 py-4 text-center text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
                  showNomeError
                    ? "border-destructive focus:ring-destructive"
                    : nome.trim().length >= 2
                    ? "border-green-500 focus:ring-green-400"
                    : "border-border focus:ring-primary"
                }`}
              />
              <AnimatePresence>
                {showNomeError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-1 text-center text-xs text-destructive"
                  >
                    Inserisci il nome
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1">
              <input
                type="text"
                placeholder="Cognome"
                value={cognome}
                onChange={(e) => { setCognome(e.target.value); setSubmitted(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                className={`w-full rounded-2xl border bg-card px-4 py-4 text-center text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
                  showCognomeError
                    ? "border-destructive focus:ring-destructive"
                    : cognome.trim().length >= 2
                    ? "border-green-500 focus:ring-green-400"
                    : "border-border focus:ring-primary"
                }`}
              />
              <AnimatePresence>
                {showCognomeError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-1 text-center text-xs text-destructive"
                  >
                    Inserisci il cognome
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Email */}
          <div className="relative">
            <input
              type="email"
              placeholder="La tua email migliore 📧"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailTouched(true); }}
              onBlur={() => setEmailTouched(true)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              className={`w-full rounded-2xl border bg-card px-6 py-4 pr-14 text-center text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
                showEmailOk
                  ? "border-green-500 focus:ring-green-400"
                  : showEmailError
                  ? "border-destructive focus:ring-destructive"
                  : "border-border focus:ring-primary"
              }`}
            />
            <AnimatePresence mode="wait">
              {showEmailOk && (
                <motion.span key="ok"
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
                >
                  <CheckCircle2 className="h-5 w-5" />
                </motion.span>
              )}
              {showEmailError && (
                <motion.span key="err"
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-destructive"
                >
                  <XCircle className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {showEmailError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center text-xs text-destructive"
              >
                Per favore, inserisci un'email valida.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* CTA */}
        <motion.button
          onClick={handleStart}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-5 text-xl font-bold text-primary-foreground active:scale-95"
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          🚀 INIZIA IL GIOCO!
        </motion.button>

        <motion.p
          className="text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.9 }}
        >
          Rispondi a 8 domande veloci e scopri il tuo match perfetto
        </motion.p>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
