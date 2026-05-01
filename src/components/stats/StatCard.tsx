interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number | null; // % change vs previous period; positive = up, negative = down
  trendColor?: "auto" | "inverse"; // auto: green=up, inverse: green=down (e.g. errors)
}

export const StatCard = ({ label, value, sub, trend, trendColor = "auto" }: StatCardProps) => {
  const hasTrend = trend !== null && trend !== undefined && !isNaN(trend) && isFinite(trend);
  const isUp = hasTrend && trend! > 0;
  const isDown = hasTrend && trend! < 0;

  let badgeClass = "bg-muted/60 text-muted-foreground";
  if (hasTrend && trend !== 0) {
    const positive = trendColor === "inverse" ? isDown : isUp;
    badgeClass = positive
      ? "bg-green-500/15 text-green-500"
      : "bg-destructive/15 text-destructive";
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex items-center justify-center gap-2">
        <p className="text-4xl font-bold text-gradient">{value}</p>
        {hasTrend && (
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
            {isUp ? "↑" : isDown ? "↓" : "→"} {trend === 0 ? "0%" : `${isUp ? "+" : ""}${Math.round(trend!)}%`}
          </span>
        )}
      </div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
};
