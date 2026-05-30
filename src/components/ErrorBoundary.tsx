import { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { translations, type Lang } from "@/i18n/translations";

interface Props {
  children: ReactNode;
  // When provided, this is rendered instead of the full-screen kiosk fallback.
  // Used for granular, in-place boundaries (e.g. a single dashboard tab) so one
  // failing section doesn't blank the whole page. Receives a reset callback
  // that clears the error and re-renders the children.
  fallback?: (reset: () => void) => ReactNode;
  // Changing any value in this array clears the error state. Pass the active
  // tab id so switching tabs recovers from a previously crashed tab.
  resetKeys?: unknown[];
}
interface State { hasError: boolean; }

// Class component can't use the useLang() hook, so we resolve the language by
// reading the same localStorage key the LanguageContext provider writes to.
// Defaults to English (per audit recommendation: international-friendly fallback).
function resolveLang(): Lang {
  try {
    const stored = localStorage.getItem("wb_lang");
    if (stored && stored in translations) return stored as Lang;
  } catch { /* localStorage unavailable */ }
  return "en";
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[webi-match] uncaught render error:", error, info.componentStack);
  }

  // Clear the error when any reset key changes (e.g. the user switches tabs)
  // so a recovered section re-mounts instead of staying stuck on the fallback.
  componentDidUpdate(prev: Props) {
    if (!this.state.hasError) return;
    const a = prev.resetKeys ?? [];
    const b = this.props.resetKeys ?? [];
    if (a.length !== b.length || a.some((v, i) => v !== b[i])) {
      this.setState({ hasError: false });
    }
  }

  private reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    // Granular, in-place fallback (does not take over the screen).
    if (this.props.fallback) return this.props.fallback(this.reset);

    const eb = translations[resolveLang()].admin.errorBoundary;

    return (
      <div
        data-testid="error-boundary"
        className="fixed inset-0 flex flex-col items-center justify-center bg-background p-8 text-center"
      >
        <motion.div
          className="max-w-sm w-full space-y-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Icon */}
          <div className="flex justify-center">
            <motion.div
              className="flex h-24 w-24 items-center justify-center rounded-3xl border border-border bg-card text-5xl shadow-card"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              🔧
            </motion.div>
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground leading-snug">
              {eb.title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {eb.subtitle}
            </p>
          </div>

          {/* Pulse indicator */}
          <div className="flex items-center justify-center gap-2">
            <motion.div
              className="h-2 w-2 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-xs text-muted-foreground/60 tracking-widest uppercase">
              Webi-Match · Webidoo Store
            </span>
          </div>

          {/* Reload button */}
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-2xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors active:scale-95"
          >
            {eb.reload}
          </button>
        </motion.div>
      </div>
    );
  }
}
