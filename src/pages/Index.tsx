import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WelcomeScreen, { type UserInfo } from "@/components/WelcomeScreen";
import QuizScreen from "@/components/QuizScreen";
import MatchResult from "@/components/MatchResult";
import SuccessScreen from "@/components/SuccessScreen";
import AttractScreen from "@/components/AttractScreen";
import { getMatchedProduct, type Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { useInactivityReset } from "@/hooks/useInactivityReset";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useLang } from "@/i18n/LanguageContext";
import { getStoredStoreId } from "@/data/stores";

type Screen = "splash" | "welcome" | "quiz" | "result" | "success";

// ── Per-screen directional transitions ────────────────────────────────────────
const screenAnim: Record<Screen, { initial: object; animate: object; exit: object; transition: object }> = {
  splash: {
    initial:    { opacity: 0 },
    animate:    { opacity: 1 },
    exit:       { opacity: 0, scale: 1.04 },
    transition: { duration: 0.4, ease: "easeOut" },
  },
  welcome: {
    initial:    { opacity: 0, y: 24 },
    animate:    { opacity: 1, y: 0  },
    exit:       { opacity: 0, y: -16, scale: 0.98 },
    transition: { duration: 0.4, ease: "easeOut" },
  },
  quiz: {
    initial:    { opacity: 0, x: 48 },
    animate:    { opacity: 1, x: 0  },
    exit:       { opacity: 0, x: -48 },
    transition: { duration: 0.35, ease: "easeOut" },
  },
  result: {
    initial:    { opacity: 0, scale: 0.94, y: 32 },
    animate:    { opacity: 1, scale: 1,    y: 0   },
    exit:       { opacity: 0, scale: 1.04          },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  success: {
    initial:    { opacity: 0, y: 52 },
    animate:    { opacity: 1, y: 0  },
    exit:       { opacity: 0, y: -24 },
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

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
  const [screen, setScreen] = useState<Screen>("splash");
  const [user, setUser] = useState<UserInfo>({ nome: "", cognome: "", email: "" });
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [matchPercent, setMatchPercent] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, boolean>>({});
  const [claiming, setClaiming] = useState(false);
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState<number | null>(null);
  const [funnelKey, setFunnelKey] = useState(() => crypto.randomUUID());
  const [activeProductIds, setActiveProductIds] = useState<Set<string> | null>(null);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, string>>({});
  const [imageOverrides, setImageOverrides] = useState<Record<string, string>>({});
  const [settingsLoadFailed, setSettingsLoadFailed] = useState(false);

  useEffect(() => {
    const storeId = getStoredStoreId() ?? "corso-vercelli";
    supabase
      .from("product_settings")
      .select("product_id, active, price_override, image_url")
      .eq("store_id", storeId)
      .then(({ data, error }) => {
        if (error) {
          console.error("[webi-match] product_settings fetch failed:", error);
          setSettingsLoadFailed(true);
          return;
        }
        if (data && data.length > 0) {
          const active = new Set(
            data.filter((r) => r.active !== false).map((r) => r.product_id),
          );
          const prices: Record<string, string> = {};
          const images: Record<string, string> = {};
          data.forEach((r) => {
            if (r.price_override) prices[r.product_id] = r.price_override;
            // @ts-ignore — image_url column added via migration
            if (r.image_url) images[r.product_id] = r.image_url;
          });
          setActiveProductIds(active);
          setPriceOverrides(prices);
          setImageOverrides(images);
        }
      });
  }, []);

  const handleSplashComplete = () => {
    setScreen("welcome");
  };

  const handleStart = (userInfo: UserInfo) => {
    setUser(userInfo);
    trackFunnel(funnelKey, "quiz_started");
    setScreen("quiz");
  };

  const handleQuizComplete = (answers: Record<number, boolean>) => {
    const { product: baseProduct, matchPercent: pct } = getMatchedProduct(answers, activeProductIds ?? undefined);
    // Apply store-specific overrides (price + image) set by manager
    const priceOverride = baseProduct && priceOverrides[baseProduct.id];
    const imageOverride = baseProduct && imageOverrides[baseProduct.id];
    const product = baseProduct ? {
      ...baseProduct,
      ...(priceOverride ? { price: priceOverride } : {}),
      ...(imageOverride ? { image: imageOverride } : {}),
    } : baseProduct;
    setMatchedProduct(product);
    setMatchPercent(pct);
    setQuizAnswers(answers);
    trackFunnel(funnelKey, "result_shown");
    setScreen("result");
  };

  // Email is collected on the welcome screen — user.email is already set when
  // handleClaim fires. We just persist the session and advance to success.
  const handleClaim = async () => {
    if (!matchedProduct || claiming) return;
    setClaiming(true);

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
      // Product snapshot — used by the Edge Function to build the email
      product_name:  matchedProduct.name,
      product_price: matchedProduct.price,
      product_image: matchedProduct.image ?? null,
    };

    // Retry up to 2 times with exponential backoff before giving up.
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
      const { error } = await supabase.from("quiz_sessions").insert(payload);
      if (!error) { lastError = null; break; }
      lastError = error;
    }
    if (lastError) console.error("[webi-match] quiz_sessions insert failed:", lastError);

    trackFunnel(funnelKey, "claimed");
    setClaiming(false);
    setScreen("success");
  };

  const handleRestart = () => {
    setUser({ nome: "", cognome: "", email: "" });
    setMatchedProduct(null);
    setMatchPercent(0);
    setQuizAnswers({});
    setInactivitySecondsLeft(null);
    setFunnelKey(crypto.randomUUID());
    setScreen("splash");
  };

  useWakeLock();
  const { dismiss } = useInactivityReset({
    enabled: screen !== "welcome" && screen !== "splash",
    onWarn:    (seconds) => setInactivitySecondsLeft(seconds),
    onReset:   handleRestart,
    onDismiss: () => setInactivitySecondsLeft(null),
  });

  const handleDismiss = () => {
    setInactivitySecondsLeft(null);
    dismiss();
  };

  const anim = screenAnim[screen];

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
          initial={anim.initial}
          animate={anim.animate}
          exit={anim.exit}
          transition={anim.transition}
        >
          {screen === "splash" && <AttractScreen onComplete={handleSplashComplete} />}
          {screen === "welcome" && <WelcomeScreen onStart={handleStart} settingsLoadFailed={settingsLoadFailed} />}
          {screen === "quiz" && <QuizScreen onComplete={handleQuizComplete} />}
          {screen === "result" && matchedProduct && (
            <MatchResult
              product={matchedProduct}
              matchPercent={matchPercent}
              userName={user.nome}
              userEmail={user.email}
              onClaim={handleClaim}
              onChangeEmail={() => setScreen("welcome")}
              claiming={claiming}
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
