import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Heart } from "lucide-react";
import SwipeCard from "./SwipeCard";
import SwipeTutorial from "./SwipeTutorial";
import QuizBackground from "./QuizBackground";
import { questions } from "@/data/questions";

interface QuizScreenProps {
  onComplete: (answers: Record<number, boolean>) => void;
}

const QuizScreen = ({ onComplete }: QuizScreenProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [showTutorial, setShowTutorial] = useState(true);

  const handleSwipe = useCallback((direction: "left" | "right") => {
    const question = questions[currentIndex];
    const newAnswers = { ...answers, [question.id]: direction === "right" };
    setAnswers(newAnswers);

    if (currentIndex + 1 >= questions.length) {
      setTimeout(() => onComplete(newAnswers), 300);
    } else {
      setTimeout(() => setCurrentIndex((i) => i + 1), 300);
    }
  }, [currentIndex, answers, onComplete]);

  const question = questions[currentIndex];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      {/* Themed background */}
      <QuizBackground emoji={question.emoji} category={question.category} />

      {/* Tutorial overlay */}
      {showTutorial && <SwipeTutorial onDismiss={() => setShowTutorial(false)} />}

      {/* Top progress bar */}
      <div className="absolute left-0 right-0 top-0 px-6 pt-6">
        <div className="mx-auto flex max-w-sm items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </span>
          <div className="flex flex-1 gap-1">
            {Array.from({ length: questions.length }).map((_, i) => (
              <motion.div
                key={i}
                className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
              >
                <motion.div
                  className="h-full rounded-full gradient-primary"
                  initial={{ width: i < currentIndex ? "100%" : "0%" }}
                  animate={{ width: i <= currentIndex ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Swipeable card */}
      <AnimatePresence mode="wait">
        <SwipeCard
          key={currentIndex}
          question={question}
          onSwipe={handleSwipe}
        />
      </AnimatePresence>

      {/* Action buttons */}
      <motion.div
        className="absolute bottom-10 flex w-full max-w-xs justify-center gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={() => handleSwipe("left")}
          className="group flex h-16 w-16 items-center justify-center rounded-full border-2 border-destructive/40 bg-destructive/10 text-destructive shadow-lg backdrop-blur-sm transition-all hover:border-destructive hover:bg-destructive/20 hover:shadow-destructive/20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="h-7 w-7 transition-transform group-hover:scale-110" strokeWidth={3} />
        </motion.button>

        <motion.button
          onClick={() => handleSwipe("right")}
          className="group flex h-16 w-16 items-center justify-center rounded-full border-2 border-success/40 bg-success/10 text-success shadow-lg backdrop-blur-sm transition-all hover:border-success hover:bg-success/20 hover:shadow-success/20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className="h-7 w-7 transition-transform group-hover:scale-110" strokeWidth={2.5} fill="currentColor" />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default QuizScreen;
