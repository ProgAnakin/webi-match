import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WelcomeScreen, { type UserInfo } from "@/components/WelcomeScreen";
import QuizScreen from "@/components/QuizScreen";
import MatchResult from "@/components/MatchResult";
import SuccessScreen from "@/components/SuccessScreen";
import { getMatchedProduct, type Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { useInactivityReset } from "@/hooks/useInactivityReset";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useLang } from "@/i18n/LanguageContext";
import { getStoredStoreId } from "@/data/stores";

type Screen = "welcome" | "quiz" | "result" | "success";

// Fire-and-forget funnel event — never blocks the user flow.
function trackFunnel(funnelKey: string, eventType: "quiz_started" | "result_shown" | "claimed") {
  supabase.from("quiz_funnel_events").insert({
    funnel_key: funnelKey,
    event_type: eventType,
    store_id: getStoredStoreId(),
  }).then(({ error }) => {
    if (error) console.error("[webi-match] funnel event failed:", eventType, error);
  });
}

const Index = () => {
  const { t } = useLang();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [user, setUser] = useState<UserInfo>({ nome: "", cognome: "", email: "" });
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [matchPercent, setMatchPercent] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, boolean>>({});
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState<number | null>(null);
  // Funnel key — generated once per quiz session to link events together
  const [funnelKey, setFunnelKey] = useState(() => crypto.randomUUID());
  // Active product IDs fetched from Supabase — null means "not loaded yet" (uses full catalogue)
  const [activeProductIds, setActiveProductIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    const storeId = getStoredStoreId() ?? "corso-vercelli";
    supabase
      .from("product_settings")
      .select("product_id, active")
      .eq("store_id", storeId)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const active = new Set(
            data.filter((r) => r.active !== false).map((r) => r.product_id),
          );
          setActiveProductIds(active);
        }
        // On error or empty table → leave null → getMatchedProduct uses all products
      });
  }, []);

  const handleStart = (userInfo: UserInfo) => {
    setUser(userInfo);
    trackFunnel(funnelKey, "quiz_started");
    setScreen("quiz");
  };

  const handleQuizComplete = (answers: Record<number, boolean>) => {
    const { product, matchPercent: pct } = getMatchedProduct(answers, activeProductIds ?? undefined);
    setMatchedProduct(product);
    setMatchPercent(pct);
    setQuizAnswers(answers);
    trackFunnel(funnelKey, "result_shown");
    setScreen("result");
  };

  const handleClaim = async () => {
    if (!matchedProduct) return;

    const payload = {
      email: user.email,
      answers: quizAnswers,
      matched_product_id: matchedProduct.id,
      match_percent: matchPercent,
      email_sent: false,
      // @ts-ignore — columns added via migration; gracefully ignored if not yet applied
      nome: user.nome,
      cognome: user.cognome,
      store_id: getStoredStoreId(),
    };

    // Retry up to 2 times with exponential backoff before giving up.
    // The user flow continues regardless — session data is non-blocking.
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
      const { error } = await supabase.from("quiz_sessions").insert(payload);
      if (!error) { lastError = null; break; }
      lastError = error;
    }
    if (lastError) console.error("[webi-match] quiz_sessions insert failed:", lastError);

    trackFunnel(funnelKey, "claimed");
    setScreen("success");
  };

  const handleRestart = () => {
    setUser({ nome: "", cognome: "", email: "" });
    setMatchedProduct(null);
    setMatchPercent(0);
    setQuizAnswers({});
    setInactivitySecondsLeft(null);
    // New funnel key for the next session
    setFunnelKey(crypto.randomUUID());
    setScreen("welcome");
  };

  useWakeLock();
  const { dismiss } = useInactivityReset({
    enabled: screen !== "welcome",
    onWarn:    (seconds) => setInactivitySecondsLeft(seconds),
    onReset:   handleRestart,
    onDismiss: () => setInactivitySecondsLeft(null), // hides frozen overlay when activity detected
  });

  // User tapped "still here" (backdrop or button) → hide overlay + restart 45s timer
  const handleDismiss = () => {
    setInactivitySecondsLeft(null);
    dismiss();
  };

  return (
    <div className="relative min-h-screen overflow-auto bg-background">
      <AnimatePresence>
        {inactivitySecondsLeft !== null && (
          <motion.div
            key="inactivity-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={handleDismiss}
          >
            {/* Stop propagation so clicks inside the card don't trigger backdrop dismiss */}
            <div
              className="mx-6 rounded-2xl bg-white p-8 text-center shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 text-5xl">⏱️</div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">{t.inactivity.title}</h2>
              <p className="mb-6 text-gray-500 text-sm">{t.inactivity.countdown}</p>
              <div className="mb-6 flex items-center justify-center">
                <span className="text-6xl font-bold text-rose-500">{inactivitySecondsLeft}</span>
                <span className="ml-2 text-2xl text-gray-400">s</span>
              </div>
              <button
                onClick={handleDismiss}
                className="w-full rounded-xl bg-primary px-6 py-3 font-semibold text-white active:opacity-90 mb-3"
              >
                {t.inactivity.dismiss}
              </button>
              <button
                onClick={handleRestart}
                className="w-full rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-600 active:bg-gray-200"
              >
                {t.inactivity.restart}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {screen === "welcome" && <WelcomeScreen onStart={handleStart} />}
          {screen === "quiz" && <QuizScreen onComplete={handleQuizComplete} />}
          {screen === "result" && matchedProduct && (
            <MatchResult
              product={matchedProduct}
              matchPercent={matchPercent}
              userName={user.nome}
              onClaim={handleClaim}
            />
          )}
          {screen === "success" && matchedProduct && (
            <SuccessScreen
              email={user.email}
              userName={`${user.nome} ${user.cognome}`}
              productName={matchedProduct.name}
              onRestart={handleRestart}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Index;
