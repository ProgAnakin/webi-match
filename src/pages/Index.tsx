import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WelcomeScreen from "@/components/WelcomeScreen";
import QuizScreen from "@/components/QuizScreen";
import MatchResult from "@/components/MatchResult";
import SuccessScreen from "@/components/SuccessScreen";
import { getMatchedProduct, type Product } from "@/data/products";

type Screen = "welcome" | "quiz" | "result" | "success";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [email, setEmail] = useState("");
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [matchPercent, setMatchPercent] = useState(0);

  const handleStart = (userEmail: string) => {
    setEmail(userEmail);
    setScreen("quiz");
  };

  const handleQuizComplete = (answers: Record<number, boolean>) => {
    const { product, matchPercent: pct } = getMatchedProduct(answers);
    setMatchedProduct(product);
    setMatchPercent(pct);
    setScreen("result");
  };

  const handleClaim = () => {
    // In production, this would trigger the email via backend
    setScreen("success");
  };

  const handleRestart = () => {
    setEmail("");
    setMatchedProduct(null);
    setMatchPercent(0);
    setScreen("welcome");
  };

  return (
    <div className="relative min-h-screen overflow-auto bg-background">
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
              onClaim={handleClaim}
            />
          )}
          {screen === "success" && matchedProduct && (
            <SuccessScreen
              email={email}
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
