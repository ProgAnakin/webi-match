import { AlertTriangle, RotateCcw } from "lucide-react";

interface TabErrorFallbackProps {
  // Clears the boundary's error state and re-renders the failed tab.
  onRetry: () => void;
  // Short label of which section failed, e.g. "Sessions". Optional.
  section?: string;
}

// In-place fallback for a single crashed dashboard tab. Keeps the header,
// store selector and the rest of the page interactive — only the failed tab
// is replaced — so a bad data row or render bug never blanks the whole
// manager screen. The user can retry without a full page reload.
export function TabErrorFallback({ onRetry, section }: TabErrorFallbackProps) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-8 text-center">
      <div className="mb-3 flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/30 bg-card text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground">
        {section ? `The ${section} section hit an error.` : "This section hit an error."}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        The rest of the dashboard is still working. Try reloading just this section.
      </p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground active:scale-95"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}
