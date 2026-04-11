import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Heart } from "lucide-react";
import SwipeCard from "./SwipeCard";
import SwipeTutorial from "./SwipeTutorial";
import QuizBackground from "./QuizBackground";
import { questions } from "@/data/questions";
import { useSound } from "@/hooks/useSound";
import { useLang } from "@/i18n/LanguageContext";

interface QuizScreenProps {
  onComplete: (answers: Record<number, boolean>) => void;
}

const QuizScreen = ({ onComplete }: QuizScreenProps) => {
  const { t } = useLang();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [showTutorial, setShowTutorial] = useState(true);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | undefined>(undefined);
  const [transitioning, setTransitioning] = useState(false);
  const transitioningRef = useRef(false);
  const { play } = useSound();

  const handleSwipe = useCallback((direction: "left" | "right") => {
    // Block rapid taps — ref check is synchronous (no stale closure issue)
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitioning(true);

    setExitDirection(direction);
    play(direction === "right" ? "swipe_yes" : "swipe_no");
    const question = questions[currentIndex];
    const newAnswers = { ...answers, [question.id]: direction === "right" };
    setAnswers(newAnswers);

    if (currentIndex + 1 >= questions.length) {
      setTimeout(() => {
        transitioningRef.current = false;
        setTransitioning(false);
        onComplete(newAnswers);
      }, 260);
    } else {
      setTimeout(() => {
        setExitDirection(undefined);
        setCurrentIndex((i) => i + 1);
        transitioningRef.current = false;
        setTransitioning(false);
      }, 260);
    }
  }, [currentIndex, answers, onComplete]);

  const question = questions[Math.min(currentIndex, questions.length - 1)];

  if (!question) return null;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      {/* Themed background */}
      <QuizBackground emoji={question.emoji} category={question.category} />

      {/* Tutorial overlay */}
      {showTutorial && <SwipeTutorial onDismiss={() => setShowTutorial(false)} />}

      {/* Top progress bar */}
      <div className="absolute left-0 right-0 top-0 px-6 pt-8">
        <div className="mx-auto flex max-w-sm flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {t.quiz.questionOf(currentIndex + 1, questions.length)}
            </span>
            <span className="text-sm font-bold text-primary">
              {Math.round((currentIndex / questions.length) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full gradient-primary"
              initial={{ width: `${((currentIndex - 1) / questions.length) * 100}%` }}
              animate={{ width: `${(currentIndex / questions.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Swipeable card — no mode="wait" so the next card starts mounting
          while the current card exits, eliminating the blank-screen gap
          that caused perceived lag on kiosk devices.
          custom is passed to AnimatePresence so the exit variant receives
          the direction synchronously (avoids stale-state jump). */}
      <AnimatePresence custom={exitDirection}>
        <SwipeCard
          key={currentIndex}
          question={question}
          onSwipe={handleSwipe}
          exitDirection={exitDirection}
        />
      </AnimatePresence>

      {/* Action buttons — dimmed and non-interactive during card transition */}
      <motion.div
        className="absolute bottom-10 flex w-full max-w-xs justify-center gap-8"
        style={{ pointerEvents: transitioning ? "none" : "auto" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: transitioning ? 0.35 : 1, y: 0 }}
        transition={{ duration: transitioning ? 0.1 : 0.3, delay: transitioning ? 0 : 0.3 }}
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
