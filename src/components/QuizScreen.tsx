import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import SwipeCard from "./SwipeCard";
import SwipeTutorial from "./SwipeTutorial";
import QuizBackground from "./QuizBackground";
import { questions } from "@/data/questions";
import { useSound } from "@/hooks/useSound";
import { useLang } from "@/i18n/LanguageContext";

interface QuizScreenProps {
  onComplete: (answers: Record<number, boolean>) => void;
}

function haptic(ms: number) {
  try { navigator.vibrate?.(ms); } catch { /* unsupported */ }
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
      }, 240);
    } else {
      setTimeout(() => {
        setExitDirection(undefined);
        setCurrentIndex((i) => i + 1);
        transitioningRef.current = false;
        setTransitioning(false);
      }, 240);
    }
  }, [currentIndex, answers, onComplete]);

  const question = questions[currentIndex];
  if (!question) return null;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      <QuizBackground emoji={question.emoji} category={question.category} />

      {showTutorial && <SwipeTutorial onDismiss={() => setShowTutorial(false)} />}

      {/* Progress */}
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
              initial={{ width: `${(Math.max(0, currentIndex - 1) / questions.length) * 100}%` }}
              animate={{ width: `${(currentIndex / questions.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            {questions.map((_, idx) => (
              <motion.div
                key={idx}
                className="rounded-full bg-primary"
                animate={{
                  width: idx === currentIndex ? 20 : 6,
                  height: 6,
                  opacity: idx <= currentIndex ? 1 : 0.3,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Card */}
      <AnimatePresence custom={exitDirection}>
        <SwipeCard
          key={currentIndex}
          question={question}
          onSwipe={handleSwipe}
          exitDirection={exitDirection}
          index={currentIndex}
        />
      </AnimatePresence>

      {/* Buttons */}
      <div
        className="absolute bottom-10 flex w-full max-w-sm items-center justify-center gap-3 px-5"
        style={{ pointerEvents: transitioning ? "none" : "auto", opacity: transitioning ? 0.4 : 1, transition: "opacity 0.15s" }}
      >
        {/* NO — left arrow */}
        <motion.button
          onClick={() => { haptic(30); handleSwipe("left"); }}
          className="flex h-14 w-[120px] items-center justify-center rounded-2xl border-2 border-destructive/60 bg-destructive/10 text-destructive backdrop-blur-sm"
          style={{ boxShadow: "0 0 22px hsl(0 84% 60% / 0.22), inset 0 0 12px hsl(0 84% 60% / 0.07)" }}
          whileHover={{ scale: 1.06, boxShadow: "0 0 34px hsl(0 84% 60% / 0.45)" }}
          whileTap={{ scale: 0.88, boxShadow: "0 0 60px hsl(0 84% 60% / 0.80), inset 0 0 24px hsl(0 84% 60% / 0.38)" }}
        >
          <ChevronsLeft className="h-9 w-9" strokeWidth={2.2} />
        </motion.button>

        {/* Center destiny text */}
        <div className="flex w-[86px] shrink-0 flex-col items-center gap-1">
          <div className="h-px w-full bg-border/35" />
          <p className="text-center text-[8px] font-black uppercase leading-tight tracking-[0.13em] text-muted-foreground/55">
            {t.quiz.chooseDestiny}
          </p>
          <div className="h-px w-full bg-border/35" />
        </div>

        {/* YES — right arrow */}
        <motion.button
          onClick={() => { haptic(45); handleSwipe("right"); }}
          className="flex h-14 w-[120px] items-center justify-center rounded-2xl border-2 border-success/60 bg-success/10 text-success backdrop-blur-sm"
          style={{ boxShadow: "0 0 22px hsl(145 80% 42% / 0.22), inset 0 0 12px hsl(145 80% 42% / 0.07)" }}
          whileHover={{ scale: 1.06, boxShadow: "0 0 34px hsl(145 80% 42% / 0.45)" }}
          whileTap={{ scale: 0.88, boxShadow: "0 0 60px hsl(145 80% 42% / 0.80), inset 0 0 24px hsl(145 80% 42% / 0.38)" }}
        >
          <ChevronsRight className="h-9 w-9" strokeWidth={2.2} />
        </motion.button>
      </div>
    </div>
  );
};

export default QuizScreen;
