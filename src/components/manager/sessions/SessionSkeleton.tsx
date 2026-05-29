export function SessionSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted/50" />
              <div className="h-3 w-48 rounded bg-muted/40" />
              <div className="h-3 w-24 rounded bg-muted/30" />
            </div>
            <div className="space-y-2">
              <div className="h-6 w-20 rounded-full bg-muted/50" />
              <div className="h-6 w-28 rounded-lg bg-muted/40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
