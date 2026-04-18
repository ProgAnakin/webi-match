import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import type { Product } from "@/data/products";
import { useSound } from "@/hooks/useSound";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";
import { useLang } from "@/i18n/LanguageContext";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const CHANGE_PIN    = "9090";
const EMAIL_TAPS    = 5;
const PIN_KEYS: (number | "⌫" | "")[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"];

interface MatchResultProps {
  product: Product;
  matchPercent: number;
  userName: string;
  userEmail: string;
  onClaim: () => void;
  onChangeEmail: (email: string) => void;
  claiming?: boolean;
  claimError?: boolean;
}

function readCssConfettiColors(): string[] {
  const style = getComputedStyle(document.documentElement);
  return Array.from({ length: 12 }, (_, i) => {
    const raw = style.getPropertyValue(`--confetti-${i + 1}`).trim();
    return raw ? `hsl(${raw})` : "#888";
  });
}

interface ConfettiData {
  id: number; delay: number; duration: number;
  left: string; color: string; size: number;
  rotateDeg: number; xOffset: number;
}

const ConfettiParticle = ({ delay, duration, left, color, size, rotateDeg, xOffset }: ConfettiData) => (
  <motion.div
    className="absolute rounded-sm pointer-events-none"
    style={{ left, top: "-5%", width: size, height: size * 0.6, backgroundColor: color }}
    animate={{ y: ["0vh", "110vh"], rotate: [0, rotateDeg], x: [0, xOffset], opacity: [1, 1, 0.4] }}
    transition={{ duration, repeat: Infinity, delay, ease: "easeIn" }}
  />
);

const MatchResult = ({
  product, matchPercent, userName, userEmail,
  onClaim, onChangeEmail, claiming = false, claimError = false,
}: MatchResultProps) => {
  const { t } = useLang();
  const [displayPercent, setDisplayPercent] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const { play } = useSound();
  const tier = useDevicePerformance();

  // ── Change-email state ─────────────────────────────────────────────────────
  const emailTapCount = useRef(0);
  const emailTapTimer = useRef<ReturnType<typeof setTimeout>>();
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [pinVerified, setPinVerified]         = useState(false);
  const [pinValue, setPinValue]               = useState("");
  const [pinError, setPinError]               = useState(false);
  const [newEmail, setNewEmail]               = useState("");
  const [newEmailTouched, setNewEmailTouched] = useState(false);

  const confettiColors = useMemo(() => readCssConfettiColors(), []);

  const ringMotionValue = useMotionValue(0);
  const circumference   = 2 * Math.PI * 56;
  const strokeDashoffset = useTransform(ringMotionValue, [0, 100], [circumference, 0]);

  useEffect(() => {
    let frame: number;
    const timeout = setTimeout(() => {
      const slotDuration = 900;
      const slotStart = performance.now();
      const runSlot = (now: number) => {
        const elapsed  = now - slotStart;
        if (elapsed < slotDuration) {
          const progress = elapsed / slotDuration;
          const speed    = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) * 0.85 : 1;
          if (Math.random() < speed) setDisplayPercent(Math.floor(Math.random() * 99) + 1);
          frame = requestAnimationFrame(runSlot);
        } else {
          setIsScanning(false);
          play("match");
          animate(ringMotionValue, matchPercent, { duration: 1.8, ease: [0.16, 1, 0.3, 1] });
          const countStart    = performance.now();
          const countDuration = 1800;
          const runCount = (now2: number) => {
            const progress = Math.min((now2 - countStart) / countDuration, 1);
            const eased    = 1 - Math.pow(1 - progress, 3);
            setDisplayPercent(Math.round(eased * matchPercent));
            if (progress < 1) frame = requestAnimationFrame(runCount);
          };
          frame = requestAnimationFrame(runCount);
        }
      };
      frame = requestAnimationFrame(runSlot);
    }, 900);
    return () => { cancelAnimationFrame(frame); clearTimeout(timeout); };
  }, [matchPercent]);

  const particleCount = tier === "high" ? 55 : tier === "mid" ? 28 : 12;
  const confettiParticles = useMemo<ConfettiData[]>(() =>
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      delay:     Math.random() * 4,
      duration:  1.8 + Math.random() * 2,
      left:      `${Math.random() * 100}%`,
      color:     confettiColors[i % confettiColors.length],
      size:      5 + Math.random() * 10,
      rotateDeg: 360 * (Math.random() > 0.5 ? 1 : -1),
      xOffset:   (Math.random() - 0.5) * 100,
    })), [particleCount, confettiColors]);

  const starCount = Math.floor(product.rating);

  const ringColor = matchPercent >= 90 ? "#6BCB77"
    : matchPercent >= 80 ? "#FFD93D"
    : matchPercent >= 65 ? "#FF8066"
    : "#4D96FF";

  const badgeBg = matchPercent >= 90 ? "bg-green-500"
    : matchPercent >= 80 ? "bg-yellow-400 text-gray-900"
    : matchPercent >= 65 ? "bg-orange-400 text-gray-900"
    : "bg-blue-500";

  // ── Email-tap handler ──────────────────────────────────────────────────────
  const handleEmailTap = useCallback(() => {
    emailTapCount.current += 1;
    clearTimeout(emailTapTimer.current);
    if (emailTapCount.current >= EMAIL_TAPS) {
      emailTapCount.current = 0;
      setPinValue("");
      setPinError(false);
      setPinVerified(false);
      setNewEmail("");
      setNewEmailTouched(false);
      setShowChangeModal(true);
    } else {
      emailTapTimer.current = setTimeout(() => { emailTapCount.current = 0; }, 2000);
    }
  }, []);

  // ── PIN keypad handler ─────────────────────────────────────────────────────
  const handlePinKey = useCallback((key: number | "⌫") => {
    if (key === "⌫") {
      setPinValue((p) => p.slice(0, -1));
      setPinError(false);
      return;
    }
    setPinValue((prev) => {
      if (prev.length >= 4) return prev;
      const next = prev + String(key);
      if (next.length === 4) {
        if (next === CHANGE_PIN) {
          setTimeout(() => setPinVerified(true), 150);
        } else {
          setPinError(true);
          setTimeout(() => { setPinValue(""); setPinError(false); }, 700);
        }
      }
      return next;
    });
  }, []);

  // ── Save new email ─────────────────────────────────────────────────────────
  const handleSaveEmail = useCallback(() => {
    setNewEmailTouched(true);
    if (!EMAIL_REGEX.test(newEmail.trim())) return;
    onChangeEmail(newEmail.trim().toLowerCase());
    setShowChangeModal(false);
    setPinVerified(false);
    setPinValue("");
    setNewEmail("");
    setNewEmailTouched(false);
  }, [newEmail, onChangeEmail]);

  const closeModal = useCallback(() => {
    setShowChangeModal(false);
    setPinVerified(false);
    setPinValue("");
    setPinError(false);
    setNewEmail("");
    setNewEmailTouched(false);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10">

      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confettiParticles.map((p) => <ConfettiParticle key={p.id} {...p} />)}
      </div>

      {/* Burst */}
      {tier !== "low" && (
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 1 }} animate={{ opacity: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          {confettiColors.slice(0, tier === "mid" ? 6 : 10).map((color, i) => (
            <motion.div key={i} className="absolute h-2 w-2 rounded-full" style={{ backgroundColor: color }}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{ scale: [0, 1.5, 0], x: Math.cos((i * 36 * Math.PI) / 180) * 140, y: Math.sin((i * 36 * Math.PI) / 180) * 140 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          ))}
        </motion.div>
      )}

      {/* ── Change-email modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showChangeModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="mx-6 w-full max-w-xs rounded-2xl border border-border bg-card p-6 shadow-2xl"
              initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              {!pinVerified ? (
                <>
                  <p className="mb-1 text-center text-sm font-bold text-foreground">Accesso consulente</p>
                  <p className="mb-5 text-center text-xs text-muted-foreground">
                    Inserisci il PIN per modificare l&apos;email
                  </p>

                  {/* PIN dots */}
                  <div className="mb-4 flex justify-center gap-3">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className={`h-3 w-3 rounded-full transition-all ${
                          i < pinValue.length
                            ? pinError ? "bg-destructive" : "bg-primary"
                            : "bg-border"
                        }`}
                        animate={pinError ? { x: [0, -4, 4, -3, 3, 0] } : {}}
                        transition={{ duration: 0.4 }}
                      />
                    ))}
                  </div>
                  {pinError && (
                    <p className="mb-3 text-center text-xs font-medium text-destructive">PIN non corretto</p>
                  )}

                  {/* Keypad */}
                  <div className="grid grid-cols-3 gap-2">
                    {PIN_KEYS.map((key, i) => (
                      <button
                        key={i}
                        disabled={key === ""}
                        onClick={() => key !== "" && handlePinKey(key as number | "⌫")}
                        className={`rounded-xl py-3.5 text-lg font-bold transition-all active:scale-95 ${
                          key === "" ? "invisible" :
                          key === "⌫" ? "bg-secondary/60 text-muted-foreground hover:bg-secondary" :
                          "bg-secondary text-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={closeModal}
                    className="mt-4 w-full text-center text-xs text-muted-foreground/60 active:opacity-70"
                  >
                    Annulla
                  </button>
                </>
              ) : (
                <>
                  <p className="mb-1 text-center text-sm font-bold text-foreground">Modifica email</p>
                  <p className="mb-1 text-center text-xs text-muted-foreground">Email attuale:</p>
                  <p className="mb-5 truncate text-center text-xs font-semibold text-foreground">
                    {userEmail}
                  </p>

                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEmail()}
                    placeholder="nuova@email.com"
                    autoFocus
                    className={`w-full rounded-xl border bg-background px-4 py-3 text-center text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary ${
                      newEmailTouched && !EMAIL_REGEX.test(newEmail.trim())
                        ? "border-destructive focus:ring-destructive"
                        : "border-border"
                    }`}
                  />
                  {newEmailTouched && !EMAIL_REGEX.test(newEmail.trim()) && (
                    <p className="mt-1 text-center text-xs text-destructive">Email non valida</p>
                  )}

                  <button
                    onClick={handleSaveEmail}
                    className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground active:scale-95 active:opacity-90"
                  >
                    Salva email
                  </button>
                  <button
                    onClick={closeModal}
                    className="mt-2 w-full text-center text-xs text-muted-foreground/60 active:opacity-70"
                  >
                    Annulla
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-5"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Personalised greeting */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <p className="text-base text-muted-foreground">{t.result.gadgetIntro(userName)}</p>
        </motion.div>

        {/* Circular ring */}
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2, stiffness: 180, damping: 22 }}
        >
          {!isScanning && (
            <motion.div
              className="absolute rounded-full"
              style={{ width: 168, height: 168, background: `radial-gradient(circle, ${ringColor}22 0%, transparent 70%)` }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <svg width="160" height="160" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="56" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" opacity="0.25" />
            <motion.circle
              cx="60" cy="60" r="56" fill="none"
              stroke={ringColor} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 60 60)"
              style={{ filter: `drop-shadow(0 0 8px ${ringColor}60)` }}
            />
            {!isScanning && (
              <motion.circle cx="60" cy="60" r="56" fill="none"
                stroke={ringColor} strokeWidth="2"
                animate={{ r: [56, 59, 56], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-5xl font-bold tabular-nums leading-none ${isScanning ? "text-muted-foreground" : "text-gradient"}`}>
              {displayPercent}%
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {isScanning ? t.result.scanning : t.result.match}
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
        >
          <h2 className="text-2xl font-bold tracking-wide text-foreground">{t.result.perfectMatch}</h2>
        </motion.div>

        {/* Product card */}
        <motion.div
          className="gradient-card shadow-card w-full overflow-hidden rounded-3xl border border-border"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
        >
          <div className="relative flex h-52 items-center justify-center bg-secondary/50 overflow-hidden">
            {product.image && !imgError ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <span className="text-6xl">📦</span>
                <span className="text-xs font-medium">{t.result.productImageAlt}</span>
              </div>
            )}
            {!isScanning && (
              <motion.div
                className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg ${badgeBg}`}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
              >
                {displayPercent}% {t.result.match}
              </motion.div>
            )}
          </div>

          <div className="p-5">
            <h3 className="text-xl font-bold leading-snug text-foreground">{product.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-2xl font-bold text-gradient">{product.price}</span>
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24"
                    fill={i < starCount ? "#FFD700" : "none"}
                    stroke={i < starCount ? "#FFD700" : "hsl(var(--muted-foreground))"}
                    strokeWidth="1.5">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                ))}
                <span className="ml-1 text-xs text-muted-foreground">{product.rating}</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Benefits strip */}
        <motion.div
          className="flex w-full gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          {[
            { icon: "🎥", label: t.result.video },
            { icon: "📖", label: t.result.manual },
            { icon: "💰", label: t.result.discount },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border p-3 ${
                i === 2
                  ? "border-primary/60 bg-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-card/80"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`text-[10px] font-semibold ${i === 2 ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* ── Email reminder (5-tap secret) ─────────────────────────────────── */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <div
            className="w-full cursor-default select-none rounded-2xl border border-border bg-card/60 px-4 py-3"
            onClick={handleEmailTap}
          >
            <p className="text-xs text-muted-foreground mb-1">{t.result.sendTo}</p>
            <p className="text-sm font-semibold text-foreground truncate">📬 {userEmail}</p>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground/45 leading-relaxed">
            Email non corretta? Chiedi a un consulente presente in negozio di modificarla.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.button
          onClick={onClaim}
          disabled={claiming}
          className="gradient-primary shadow-glow w-full rounded-2xl px-8 py-5 text-xl font-bold text-primary-foreground active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          whileTap={{ scale: claiming ? 1 : 0.97 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.4 }}
        >
          {claiming ? "…" : t.result.cta}
        </motion.button>

        {/* Claim error feedback */}
        <AnimatePresence>
          {claimError && (
            <motion.p
              className="text-center text-xs font-medium text-destructive"
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              Errore di connessione — riprova tra qualche secondo.
            </motion.p>
          )}
        </AnimatePresence>

        <motion.p
          className="text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.9 }}
        >
          {t.result.emailSubtitle}
        </motion.p>
      </motion.div>
    </div>
  );
};

export default MatchResult;
