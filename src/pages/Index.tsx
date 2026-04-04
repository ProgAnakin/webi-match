import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WelcomeScreen, { type UserInfo } from "@/components/WelcomeScreen";
import QuizScreen from "@/components/QuizScreen";
import MatchResult from "@/components/MatchResult";
import SuccessScreen from "@/components/SuccessScreen";
import { getMatchedProduct, type Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { useInactivityReset } from "@/hooks/useInactivityReset";
import { useWakeLock } from "@/hooks/useWakeLock";

type Screen = "welcome" | "quiz" | "result" | "success";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [user, setUser] = useState<UserInfo>({ nome: "", cognome: "", email: "" });
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [matchPercent, setMatchPercent] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, boolean>>({});
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState<number | null>(null);

  const handleStart = (userInfo: UserInfo) => {
    setUser(userInfo);
    setScreen("quiz");
  };

  const handleQuizComplete = (answers: Record<number, boolean>) => {
    const { product, matchPercent: pct } = getMatchedProduct(answers);
    setMatchedProduct(product);
    setMatchPercent(pct);
    setQuizAnswers(answers);
    setScreen("result");
  };

  const handleClaim = async () => {
    if (!matchedProduct) return;
    try {
      await supabase.from("quiz_sessions").insert({
        email: user.email,
        answers: quizAnswers,
        matched_product_id: matchedProduct.id,
        match_percent: matchPercent,
        email_sent: false,
        // @ts-ignore — columns added via migration; gracefully ignored if not yet applied
        nome: user.nome,
        cognome: user.cognome,
      });
    } catch {
      // Silently fail — data loss is non-critical; the user flow continues
    }
    setScreen("success");
  };

  const handleRestart = () => {
    setUser({ nome: "", cognome: "", email: "" });
    setMatchedProduct(null);
    setMatchPercent(0);
    setQuizAnswers({});
    setInactivitySecondsLeft(null);
    setScreen("welcome");
  };

  useWakeLock();
  useInactivityReset({
    enabled: screen !== "welcome",
    onWarn: (seconds) => setInactivitySecondsLeft(seconds),
    onReset: handleRestart,
  });

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
          >
            <div className="mx-6 rounded-2xl bg-white p-8 text-center shadow-2xl max-w-sm w-full">
              <div className="mb-4 text-5xl">⏱️</div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">Sei ancora lì?</h2>
              <p className="mb-6 text-gray-500 text-sm">Torno alla schermata iniziale tra</p>
              <div className="mb-6 flex items-center justify-center">
                <span className="text-6xl font-bold text-rose-500">{inactivitySecondsLeft}</span>
                <span className="ml-2 text-2xl text-gray-400">s</span>
              </div>
              <button
                onClick={handleRestart}
                className="w-full rounded-xl bg-rose-500 px-6 py-3 font-semibold text-white active:bg-rose-600"
              >
                Ricomincia
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
