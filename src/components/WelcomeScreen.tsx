import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import webidooLogo from "@/assets/webidoo-logo.png";
import DiscoveryBackground from "./DiscoveryBackground";
import AdminPinOverlay from "./AdminPinOverlay";
import { useSound } from "@/hooks/useSound";
import { useLang } from "@/i18n/LanguageContext";
import { LANGUAGES } from "@/i18n/translations";
import { getStoredStoreId, getStoreById } from "@/data/stores";

export interface UserInfo {
  nome: string;
  cognome: string;
  email: string;
}

interface WelcomeScreenProps {
  onStart: (user: UserInfo) => void;
  settingsLoadFailed?: boolean;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX = /^[\p{L}\s'\-]{2,100}$/u;

function sanitizeName(value: string): string {
  return value
    .replace(/[^\p{L}\s'\-]/gu, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 100);
}

// ─── Language Selector ────────────────────────────────────────────────────────
const LanguageSelector = () => {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-1.5">
      {LANGUAGES.map(({ code, flag, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
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

// ─── Welcome Form ─────────────────────────────────────────────────────────────
const WelcomeForm = ({ onStart }: { onStart: (user: UserInfo) => void }) => {
  const { t } = useLang();
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { play } = useSound();

  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const isNomeValid = NAME_REGEX.test(nome.trim());
  const isCognomeValid = NAME_REGEX.test(cognome.trim());
  const isFormValid = isNomeValid && isCognomeValid && isEmailValid;

  const showEmailError = emailTouched && email.trim().length > 0 && !isEmailValid;
  const showEmailOk = email.trim().length > 0 && isEmailValid;
  const showNomeError = submitted && !isNomeValid;
  const showCognomeError = submitted && !isCognomeValid;

  const handleNome = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNome(sanitizeName(e.target.value));
    setSubmitted(false);
  }, []);

  const handleCognome = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCognome(sanitizeName(e.target.value));
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
    onStart({ nome: nome.trim(), cognome: cognome.trim(), email: email.trim().toLowerCase() });
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
          <input type="text" placeholder={t.welcome.firstName} value={nome}
            onChange={handleNome} onKeyDown={onKeyDown} className={nomeClass} />
          {showNomeError && (
            <p className="mt-1 text-center text-xs text-destructive">{t.welcome.firstNameError}</p>
          )}
        </div>
        <div className="flex-1">
          <input type="text" placeholder={t.welcome.lastName} value={cognome}
            onChange={handleCognome} onKeyDown={onKeyDown} className={cognomeClass} />
          {showCognomeError && (
            <p className="mt-1 text-center text-xs text-destructive">{t.welcome.lastNameError}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="relative">
        <input type="email" placeholder={t.welcome.emailPlaceholder}
          value={email} onChange={handleEmail}
          onBlur={() => setEmailTouched(true)}
          onKeyDown={onKeyDown} className={emailClass} />
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
        <p className="text-center text-xs text-destructive">{t.welcome.emailError}</p>
      )}

      {/* CTA */}
      <motion.button
        onClick={handleStart}
        className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-5 text-xl font-bold text-primary-foreground active:scale-95"
        whileTap={{ scale: 0.97 }}
      >
        {t.welcome.cta}
      </motion.button>

      <p className="text-center text-xs text-muted-foreground/60">{t.welcome.subtitle}</p>
    </div>
  );
};

// ─── Store Badge ──────────────────────────────────────────────────────────────
const StoreBadge = ({ onTap, refreshKey }: { onTap: () => void; refreshKey: number }) => {
  const storeId = getStoredStoreId();
  const store = storeId ? getStoreById(storeId) : null;
  // refreshKey is used to force re-render when store changes (see WelcomeScreen)
  void refreshKey;

  return (
    <button
      onClick={onTap}
      className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs backdrop-blur-sm transition-colors hover:bg-card"
    >
      <span className="text-base">📍</span>
      {store ? (
        <span className="font-medium text-foreground">{store.shortName}</span>
      ) : (
        <span className="font-medium text-amber-500">Sede non configurata</span>
      )}
    </button>
  );
};

// ─── Welcome Screen ────────────────────────────────────────────────────────────
const LOGO_TAPS_REQUIRED = 6;

const WelcomeScreen = ({ onStart, settingsLoadFailed = false }: WelcomeScreenProps) => {
  const { t } = useLang();
  const [showPin, setShowPin] = useState(false);
  const [storeBadgeKey, setStoreBadgeKey] = useState(0);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleLogoTap = useCallback(() => {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    if (tapCount.current >= LOGO_TAPS_REQUIRED) {
      tapCount.current = 0;
      setShowPin(true);
    } else {
      tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-8">
      <DiscoveryBackground />

      {/* Language selector — top-right, above background */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>

      {/* Store badge — bottom-left, tapping opens staff PIN */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col items-start gap-1.5">
        <StoreBadge
          onTap={() => setShowPin(true)}
          refreshKey={storeBadgeKey}
        />
        {settingsLoadFailed && (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
            ⚠ Catalogo offline — verifica connessione
          </span>
        )}
      </div>

      {/* Admin PIN overlay */}
      <AnimatePresence>
        {showPin && (
          <AdminPinOverlay
            onClose={() => {
              setShowPin(false);
              // Bump key so StoreBadge re-reads localStorage after store change
              setStoreBadgeKey((k) => k + 1);
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Logo — tap 6× to open staff PIN */}
        <motion.img
          src={webidooLogo}
          alt="Webidoo Store"
          className="h-44 w-auto"
          onClick={handleLogoTap}
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
          <p className="text-base text-muted-foreground">{t.welcome.tagline}</p>
        </motion.div>

        {/* Form */}
        <WelcomeForm onStart={onStart} />
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
