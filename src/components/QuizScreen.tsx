import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SwipeCard from "./SwipeCard";
import { questions } from "@/data/questions";

interface QuizScreenProps {
  onComplete: (answers: Record<number, boolean>) => void;
}

const QuizScreen = ({ onComplete }: QuizScreenProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});

  const handleSwipe = (direction: "left" | "right") => {
    const question = questions[currentIndex];
    const newAnswers = { ...answers, [question.id]: direction === "right" };

    setAnswers(newAnswers);

    if (currentIndex + 1 >= questions.length) {
      setTimeout(() => onComplete(newAnswers), 300);
    } else {
      setTimeout(() => setCurrentIndex((i) => i + 1), 300);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* Header */}
      <motion.div
        className="absolute left-0 right-0 top-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-lg font-semibold text-muted-foreground">
          Swipe para descobrir seu match! 👆
        </h2>
      </motion.div>

      {/* Swipeable card */}
      <AnimatePresence mode="wait">
        <SwipeCard
          key={currentIndex}
          question={questions[currentIndex]}
          onSwipe={handleSwipe}
          currentIndex={currentIndex}
          total={questions.length}
        />
      </AnimatePresence>

      {/* Button hints */}
      <motion.div
        className="absolute bottom-12 flex w-full max-w-sm justify-between px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={() => handleSwipe("left")}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-destructive text-2xl transition-transform active:scale-90"
        >
          ❌
        </button>
        <button
          onClick={() => handleSwipe("right")}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-success text-2xl transition-transform active:scale-90"
        >
          ✅
        </button>
      </motion.div>
    </div>
  );
};

export default QuizScreen;
