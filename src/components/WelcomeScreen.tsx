import { useState, useCallback } from "react";
import { motion } from "framer-motion";
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

// Separate inner form component so its re-renders never touch DiscoveryBackground
const WelcomeForm = ({ onStart }: { onStart: (user: UserInfo) => void }) => {
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

  const handleNome = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNome(e.target.value);
    setSubmitted(false);
  }, []);

  const handleCognome = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCognome(e.target.value);
    setSubmitted(false);
  }, []);

  const handleEmail = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailTouched(true);
  }, []);

  const handleStart = useCallback(() => {
    setSubmitted(true);
    setEmailTouched(true);
    if (!isFormValid) return;
    play("start");
    onStart({ nome: nome.trim(), cognome: cognome.trim(), email: email.trim() });
  }, [isFormValid, nome, cognome, email, play, onStart]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleStart();
  }, [handleStart]);

  const nomeClass = `w-full rounded-2xl border bg-card px-4 py-4 text-center text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
    showNomeError ? "border-destructive focus:ring-destructive" : isNomeValid ? "border-green-500 focus:ring-green-400" : "border-border focus:ring-primary"
  }`;

  const cognomeClass = `w-full rounded-2xl border bg-card px-4 py-4 text-center text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
    showCognomeError ? "border-destructive focus:ring-destructive" : isCognomeValid ? "border-green-500 focus:ring-green-400" : "border-border focus:ring-primary"
  }`;

  const emailClass = `w-full rounded-2xl border bg-card px-6 py-4 pr-14 text-center text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
    showEmailOk ? "border-green-500 focus:ring-green-400" : showEmailError ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
  }`;

  return (
    <div className="w-full space-y-3">
      {/* Nome + Cognome */}
      <div className="flex gap-3">
        <div className="flex-1">
          <input type="text" placeholder="Nome" value={nome}
            onChange={handleNome} onKeyDown={onKeyDown}
            className={nomeClass}
          />
          {showNomeError && (
            <p className="mt-1 text-center text-xs text-destructive">Inserisci il nome</p>
          )}
        </div>
        <div className="flex-1">
          <input type="text" placeholder="Cognome" value={cognome}
            onChange={handleCognome} onKeyDown={onKeyDown}
            className={cognomeClass}
          />
          {showCognomeError && (
            <p className="mt-1 text-center text-xs text-destructive">Inserisci il cognome</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="relative">
        <input type="email" placeholder="La tua email migliore 📧"
          value={email} onChange={handleEmail}
          onBlur={() => setEmailTouched(true)}
          onKeyDown={onKeyDown}
          className={emailClass}
        />
        {showEmailOk && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
            <CheckCircle2 className="h-5 w-5" />
          </span>
        )}
        {showEmailError && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-destructive">
            <XCircle className="h-5 w-5" />
          </span>
        )}
      </div>
      {showEmailError && (
        <p className="text-center text-xs text-destructive">
          Per favore, inserisci un'email valida.
        </p>
      )}

      {/* CTA */}
      <motion.button
        onClick={handleStart}
        className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-5 text-xl font-bold text-primary-foreground active:scale-95"
        whileTap={{ scale: 0.97 }}
      >
        🚀 INIZIA IL GIOCO!
      </motion.button>

      <p className="text-center text-xs text-muted-foreground/60">
        Rispondi a 8 domande veloci e scopri il tuo match perfetto
      </p>
    </div>
  );
};

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => (
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

      {/* Form — isolated component, its re-renders stay local */}
      <WelcomeForm onStart={onStart} />
    </motion.div>
  </div>
);

export default WelcomeScreen;
